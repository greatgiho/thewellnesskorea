-- A separate price for children.
--
-- One nullable column rather than a flag plus a price: null means the class
-- has no child rate at all, which is the case for every class that exists
-- today and for anything adults-only. Zero is a different thing and a real
-- setting — children attend free.
--
-- The currency is not duplicated. A class cannot be USD for adults and KRW for
-- children; that would decide the payment path (online vs on-site) per
-- attendee and split one booking across two flows.

alter table public.sessions
  add column if not exists child_price_amount numeric(12,2);

comment on column public.sessions.child_price_amount is
  'Price for a child ticket, in price_currency. Null = this class has no child rate; 0 = children attend free.';

alter table public.sessions
  drop constraint if exists sessions_child_price_nonneg;
alter table public.sessions
  add constraint sessions_child_price_nonneg
  check (child_price_amount is null or child_price_amount >= 0);

-- The same rule the adult price already carries (037): a fixed discount may
-- not exceed the price it comes off. Without this, a ₩20,000 discount on a
-- ₩15,000 child rate silently makes children free.
alter table public.sessions
  drop constraint if exists sessions_child_discount_check;
alter table public.sessions
  add constraint sessions_child_discount_check
  check (
    discount_type is distinct from 'fixed'
    or child_price_amount is null
    or discount_value <= child_price_amount
  );

-- ---------------------------------------------------------------------------
-- Which rate a booking was sold at.
--
-- Stored rather than derived from the amount charged: a coupon, a discount, or
-- a later price edit all make "what was paid" a bad way to answer "was this a
-- child ticket?", and the door needs the answer.
-- ---------------------------------------------------------------------------

alter table public.bookings
  add column if not exists attendee_type text not null default 'adult';

alter table public.bookings
  drop constraint if exists bookings_attendee_type_check;
alter table public.bookings
  add constraint bookings_attendee_type_check
  check (attendee_type in ('adult', 'child'));

-- One booking per person per class becomes one per person per class per rate.
--
-- The booking functions carry the same rule, but these indexes are what
-- actually enforce it, and leaving them keyed on (session, person) alone would
-- refuse a parent booking their own seat and their child's — the case the
-- child rate exists to serve. Renamed so the key is legible from the name and
-- so 013's `create index if not exists` cannot resurrect the old shape.
drop index if exists public.bookings_session_guest_email_active_idx;
create unique index if not exists bookings_session_guest_email_attendee_active_idx
  on public.bookings (session_id, guest_email, attendee_type)
  where status = 'confirmed';

drop index if exists public.bookings_session_user_active_idx;
create unique index if not exists bookings_session_user_attendee_active_idx
  on public.bookings (session_id, user_id, attendee_type)
  where status = 'confirmed' and user_id is not null;

-- ---------------------------------------------------------------------------
-- The price a rate starts from, before discounts.
--
-- A function so that check_coupon and both booking RPCs cannot disagree about
-- what "the price" means for a child. Falls back to the adult price when the
-- class has no child rate, so a stray 'child' can never book for free.
-- ---------------------------------------------------------------------------

create or replace function public.session_base_price(
  p_price numeric,
  p_child_price numeric,
  p_attendee_type text
)
returns numeric
language sql
immutable
as $$
  select case
    when p_attendee_type = 'child' and p_child_price is not null then p_child_price
    else p_price
  end;
$$;

comment on function public.session_base_price is
  'List price for one attendee type, before discount. Mirrors basePriceFor() in lib/payments/money.ts.';

-- ---------------------------------------------------------------------------
-- check_coupon: measure the coupon against the rate actually being bought.
--
-- Otherwise a percentage coupon on a child ticket is computed off the adult
-- price, and a fixed coupon is compared against a total the customer is not
-- being charged.
-- ---------------------------------------------------------------------------

create or replace function public.check_coupon(
  p_code text,
  p_session_id uuid,
  p_email text default null,
  p_lock boolean default false,
  p_attendee_type text default 'adult'
)
returns table (
  ok boolean,
  reason text,
  coupon_id uuid,
  final_amount numeric,
  discount_amount numeric
)
language plpgsql
security definer
set search_path to 'public'
as $$
declare
  v_coupon public.coupons%rowtype;
  v_session public.sessions%rowtype;
  v_email text;
  v_used int;
  v_used_by_user int;
  v_base numeric;
  v_session_final numeric;
  v_coupon_final numeric;
  v_best numeric;
begin
  select * into v_session from public.sessions where id = p_session_id;
  if not found then
    return query select false, 'session_not_found', null::uuid, null::numeric, null::numeric;
    return;
  end if;

  v_base := public.session_base_price(
    v_session.price_amount, v_session.child_price_amount, p_attendee_type
  );

  -- The price to beat: whatever the class already costs after its own
  -- discount. A coupon that cannot beat it is not applied.
  v_session_final := public.session_final_price(
    v_base, v_session.price_currency,
    v_session.discount_type, v_session.discount_value
  );

  if p_lock then
    select * into v_coupon from public.coupons
    where upper(btrim(code)) = upper(btrim(p_code))
    for update;
  else
    select * into v_coupon from public.coupons
    where upper(btrim(code)) = upper(btrim(p_code));
  end if;

  if not found then
    return query select false, 'not_found', null::uuid, v_session_final, 0::numeric;
    return;
  end if;

  if not v_coupon.is_active then
    return query select false, 'inactive', v_coupon.id, v_session_final, 0::numeric;
    return;
  end if;

  if v_coupon.starts_at is not null and now() < v_coupon.starts_at then
    return query select false, 'not_started', v_coupon.id, v_session_final, 0::numeric;
    return;
  end if;

  if v_coupon.ends_at is not null and now() > v_coupon.ends_at then
    return query select false, 'expired', v_coupon.id, v_session_final, 0::numeric;
    return;
  end if;

  if v_coupon.session_id is not null and v_coupon.session_id <> p_session_id then
    return query select false, 'not_applicable', v_coupon.id, v_session_final, 0::numeric;
    return;
  end if;

  if v_coupon.experience_id is not null
     and v_coupon.experience_id is distinct from v_session.experience_id then
    return query select false, 'not_applicable', v_coupon.id, v_session_final, 0::numeric;
    return;
  end if;

  -- A fixed discount in the wrong currency is meaningless, not merely useless.
  if v_coupon.discount_type = 'fixed'
     and v_coupon.currency is distinct from v_session.price_currency then
    return query select false, 'currency_mismatch', v_coupon.id, v_session_final, 0::numeric;
    return;
  end if;

  if v_coupon.max_redemptions is not null then
    select count(*) into v_used
    from public.coupon_redemptions cr where cr.coupon_id = v_coupon.id;
    if v_used >= v_coupon.max_redemptions then
      return query select false, 'limit_reached', v_coupon.id, v_session_final, 0::numeric;
      return;
    end if;
  end if;

  v_email := public.normalize_email(coalesce(p_email, ''));
  if v_coupon.max_per_user is not null and v_email <> '' then
    select count(*) into v_used_by_user
    from public.coupon_redemptions cr
    where cr.coupon_id = v_coupon.id and cr.email = v_email;
    if v_used_by_user >= v_coupon.max_per_user then
      return query select false, 'user_limit_reached', v_coupon.id, v_session_final, 0::numeric;
      return;
    end if;
  end if;

  -- Coupon applies to the list price, then competes with the session discount.
  v_coupon_final := public.session_final_price(
    v_base, v_session.price_currency,
    v_coupon.discount_type, v_coupon.discount_value
  );
  v_best := least(v_session_final, v_coupon_final);

  if v_best >= v_session_final then
    return query select false, 'not_better', v_coupon.id, v_session_final, 0::numeric;
    return;
  end if;

  return query select true, null::text, v_coupon.id, v_best, (v_session_final - v_best);
end;
$$;

-- Argument list spelled out: the old overload still exists at this point, so
-- the bare name is ambiguous.
comment on function public.check_coupon(text, uuid, text, boolean, text) is
  'Validate a coupon against a session and an attendee type. Returns ok=false with a machine-readable reason rather than raising, so the booking form can explain the failure. Pass p_lock=true inside a booking transaction to hold the coupon row while the usage limit is checked.';

-- The old signature would otherwise be picked by the four-argument calls this
-- migration is replacing, quietly pricing every child ticket as an adult.
drop function if exists public.check_coupon(text, uuid, text, boolean);

revoke all on function public.check_coupon(text, uuid, text, boolean, text) from public;
revoke all on function public.check_coupon(text, uuid, text, boolean, text) from anon;
revoke all on function public.check_coupon(text, uuid, text, boolean, text) from authenticated;
grant execute on function public.check_coupon(text, uuid, text, boolean, text) to service_role;

-- ---------------------------------------------------------------------------
-- Booking RPCs take the attendee type.
--
-- The client sends which rate it is asking for, never the price. Everything
-- about what that costs is recomputed here, under the same lock as before.
--
-- The duplicate-booking check now includes the attendee type. It exists to
-- stop someone booking the same class twice, but a parent booking a seat for
-- themselves and one for their child is two bookings on one email address and
-- was refused outright — the reason this pair of columns is worth having at
-- all. Two adult tickets on one email is still refused.
-- ---------------------------------------------------------------------------

create or replace function public.create_booking(
  p_session_id uuid,
  p_guest_name text,
  p_guest_email text,
  p_guest_phone text default null,
  p_user_id uuid default null,
  p_coupon_code text default null,
  p_attendee_type text default 'adult'
)
returns table(booking_id uuid, cancel_token text)
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  v_session public.sessions%rowtype;
  v_email text;
  v_booking_id uuid;
  v_cancel_token text;
  v_base numeric;
  v_amount numeric;
  v_coupon record;
  -- A plpgsql record stays unassigned until a SELECT INTO touches it, and
  -- reading a field of an unassigned record raises. Without a separate flag,
  -- every booking made WITHOUT a coupon fails at the redemption check (040).
  v_has_coupon boolean := false;
begin
  v_email := public.normalize_email(p_guest_email);

  if v_email = '' or trim(p_guest_name) = '' then
    raise exception 'Name and email are required.';
  end if;

  if p_attendee_type not in ('adult', 'child') then
    raise exception 'Unknown attendee type.';
  end if;

  select * into v_session from public.sessions where id = p_session_id for update;

  if not found then
    raise exception 'Session not found.';
  end if;

  if v_session.status <> 'confirmed' or not v_session.is_published then
    raise exception 'Session is not available for booking.';
  end if;

  if v_session.starts_at <= now() then
    raise exception 'Session has already started or ended.';
  end if;

  if p_attendee_type = 'child' and v_session.child_price_amount is null then
    raise exception 'This class does not offer a child rate.';
  end if;

  v_base := public.session_base_price(
    v_session.price_amount, v_session.child_price_amount, p_attendee_type
  );
  v_amount := public.session_final_price(
    v_base, v_session.price_currency,
    v_session.discount_type, v_session.discount_value
  );

  if nullif(btrim(coalesce(p_coupon_code, '')), '') is not null then
    select * into v_coupon
    from public.check_coupon(p_coupon_code, p_session_id, v_email, true, p_attendee_type);
    -- 'not_better' is not a failure: the class is already cheaper than the
    -- coupon would make it, so book at that price rather than refusing a
    -- customer who would have paid less anyway. Anything else is refused so
    -- they are not charged full price expecting a discount.
    if not v_coupon.ok and v_coupon.reason is distinct from 'not_better' then
      raise exception 'Coupon cannot be used: %', v_coupon.reason;
    end if;
    if v_coupon.ok then
      v_has_coupon := true;
      v_amount := v_coupon.final_amount;
    end if;
  end if;

  if v_amount > 0 and v_session.price_currency = 'USD' then
    raise exception 'Online payment required. Use create_booking_hold instead.';
  end if;

  if v_session.booked_count >= v_session.capacity then
    raise exception 'Session is full.';
  end if;

  if exists (
    select 1 from public.bookings b
    where b.session_id = p_session_id
      and (b.status = 'confirmed' or public.is_booking_hold_active(b))
      and b.attendee_type = p_attendee_type
      and (b.guest_email = v_email or (p_user_id is not null and b.user_id = p_user_id))
  ) then
    raise exception 'You already have a booking for this session.';
  end if;

  insert into public.bookings
    (session_id, user_id, guest_name, guest_email, guest_phone, attendee_type)
  values
    (p_session_id, p_user_id, trim(p_guest_name), v_email,
     nullif(trim(p_guest_phone), ''), p_attendee_type)
  returning public.bookings.id, public.bookings.cancel_token
  into v_booking_id, v_cancel_token;

  if v_has_coupon then
    insert into public.coupon_redemptions
      (coupon_id, booking_id, user_id, email, amount_discounted)
    values
      (v_coupon.coupon_id, v_booking_id, p_user_id, v_email, v_coupon.discount_amount);
  end if;

  -- Money is owed but not yet collected: pending until an admin records it (040).
  if v_amount > 0 then
    insert into public.payments (
      booking_id, merchant_uid, pg_provider, amount, currency, status
    )
    values (
      v_booking_id,
      'twk-' || replace(gen_random_uuid()::text, '-', ''),
      'onsite',
      v_amount,
      v_session.price_currency,
      'pending'
    );
  end if;

  update public.sessions set booked_count = booked_count + 1 where id = p_session_id;

  return query select v_booking_id, v_cancel_token;
end;
$function$;

create or replace function public.create_booking_hold(
  p_session_id uuid,
  p_guest_name text,
  p_guest_email text,
  p_guest_phone text default null,
  p_user_id uuid default null,
  p_pg_provider text default 'portone',
  p_hold_minutes integer default 10,
  p_coupon_code text default null,
  p_attendee_type text default 'adult'
)
returns table(
  booking_id uuid,
  cancel_token text,
  merchant_uid text,
  amount numeric,
  expires_at timestamptz
)
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  v_session public.sessions%rowtype;
  v_email text;
  v_booking_id uuid;
  v_cancel_token text;
  v_merchant_uid text;
  v_expires timestamptz;
  v_base numeric;
  v_amount numeric;
  v_coupon record;
  v_has_coupon boolean := false;
begin
  v_email := public.normalize_email(p_guest_email);

  if v_email = '' or trim(p_guest_name) = '' then
    raise exception 'Name and email are required.';
  end if;

  if p_hold_minutes < 1 or p_hold_minutes > 60 then
    raise exception 'Hold minutes must be between 1 and 60.';
  end if;

  if trim(p_pg_provider) = '' then
    raise exception 'pg_provider is required.';
  end if;

  if p_attendee_type not in ('adult', 'child') then
    raise exception 'Unknown attendee type.';
  end if;

  select * into v_session from public.sessions where id = p_session_id for update;

  if not found then
    raise exception 'Session not found.';
  end if;

  if v_session.status <> 'confirmed' or not v_session.is_published then
    raise exception 'Session is not available for booking.';
  end if;

  if v_session.starts_at <= now() then
    raise exception 'Session has already started or ended.';
  end if;

  if p_attendee_type = 'child' and v_session.child_price_amount is null then
    raise exception 'This class does not offer a child rate.';
  end if;

  v_base := public.session_base_price(
    v_session.price_amount, v_session.child_price_amount, p_attendee_type
  );
  v_amount := public.session_final_price(
    v_base, v_session.price_currency,
    v_session.discount_type, v_session.discount_value
  );

  if nullif(btrim(coalesce(p_coupon_code, '')), '') is not null then
    select * into v_coupon
    from public.check_coupon(p_coupon_code, p_session_id, v_email, true, p_attendee_type);
    -- 'not_better' is not a failure: the class is already cheaper than the
    -- coupon would make it, so book at that price rather than refusing a
    -- customer who would have paid less anyway. Anything else is refused so
    -- they are not charged full price expecting a discount.
    if not v_coupon.ok and v_coupon.reason is distinct from 'not_better' then
      raise exception 'Coupon cannot be used: %', v_coupon.reason;
    end if;
    if v_coupon.ok then
      v_has_coupon := true;
      v_amount := v_coupon.final_amount;
    end if;
  end if;

  -- Guard on what is actually charged: a child rate of 0, a coupon, or a full
  -- discount all make this free, and a free class books through
  -- create_booking instead.
  if v_amount <= 0 then
    raise exception 'This session does not require online payment. Use create_booking instead.';
  end if;

  if v_session.booked_count >= v_session.capacity then
    raise exception 'Session is full.';
  end if;

  if exists (
    select 1 from public.bookings b
    where b.session_id = p_session_id
      and (b.status = 'confirmed' or public.is_booking_hold_active(b))
      and b.attendee_type = p_attendee_type
      and (b.guest_email = v_email or (p_user_id is not null and b.user_id = p_user_id))
  ) then
    raise exception 'You already have a booking for this session.';
  end if;

  v_expires := now() + make_interval(mins => p_hold_minutes);
  v_merchant_uid := 'twk-' || replace(gen_random_uuid()::text, '-', '');

  insert into public.bookings (
    session_id, user_id, guest_name, guest_email, guest_phone,
    attendee_type, status, expires_at
  )
  values (
    p_session_id, p_user_id, trim(p_guest_name), v_email,
    nullif(trim(p_guest_phone), ''), p_attendee_type, 'pending_payment', v_expires
  )
  returning public.bookings.id, public.bookings.cancel_token
  into v_booking_id, v_cancel_token;

  if v_has_coupon then
    insert into public.coupon_redemptions
      (coupon_id, booking_id, user_id, email, amount_discounted)
    values
      (v_coupon.coupon_id, v_booking_id, p_user_id, v_email, v_coupon.discount_amount);
  end if;

  insert into public.payments (
    booking_id, merchant_uid, pg_provider, amount, currency, status
  )
  values (
    v_booking_id, v_merchant_uid, trim(p_pg_provider),
    v_amount, v_session.price_currency, 'pending'
  );

  update public.sessions set booked_count = booked_count + 1 where id = p_session_id;

  return query
  select v_booking_id, v_cancel_token, v_merchant_uid, v_amount, v_expires;
end;
$function$;

-- New optional argument = new signature; the old ones would otherwise linger
-- and be picked by callers that omit the attendee type.
drop function if exists public.create_booking(uuid, text, text, text, uuid, text);
drop function if exists public.create_booking_hold(uuid, text, text, text, uuid, text, integer, text);

revoke all on function public.create_booking_hold(uuid, text, text, text, uuid, text, integer, text, text) from public;
revoke all on function public.create_booking_hold(uuid, text, text, text, uuid, text, integer, text, text) from anon;
revoke all on function public.create_booking_hold(uuid, text, text, text, uuid, text, integer, text, text) from authenticated;
grant execute on function public.create_booking_hold(uuid, text, text, text, uuid, text, integer, text, text)
  to service_role;

grant execute on function public.create_booking(uuid, text, text, text, uuid, text, text)
  to anon, authenticated, service_role;

-- ---------------------------------------------------------------------------
-- Partners set their own child rate too.
--
-- Same reasoning as 039: this writes exactly the pricing columns and nothing
-- else, because RLS cannot limit which columns an update touches.
-- ---------------------------------------------------------------------------

create or replace function public.set_session_pricing(
  p_session_id uuid,
  p_price_currency text,
  p_price_amount numeric,
  p_discount_type text default null,
  p_discount_value numeric default null,
  p_child_price_amount numeric default null
)
returns void
language plpgsql
security definer
set search_path to 'public'
as $$
declare
  v_partner_id uuid;
  v_session public.sessions%rowtype;
begin
  select id into v_partner_id
  from public.partners
  where user_id = auth.uid()
    and registration_status in ('admin', 'approved');

  if v_partner_id is null then
    raise exception 'Not a partner.';
  end if;

  select * into v_session
  from public.sessions
  where id = p_session_id
  for update;

  if not found then
    raise exception 'Session not found.';
  end if;

  if v_session.instructor_id is distinct from v_partner_id then
    raise exception 'This class belongs to another instructor.';
  end if;

  if p_price_currency not in ('KRW', 'USD') then
    raise exception 'Unsupported currency.';
  end if;

  if p_price_amount is null or p_price_amount < 0 then
    raise exception 'Price cannot be negative.';
  end if;

  if p_child_price_amount is not null and p_child_price_amount < 0 then
    raise exception 'Child price cannot be negative.';
  end if;

  -- Mirror the column constraints so the partner gets a clear error rather
  -- than a constraint violation.
  if p_discount_type is not null then
    if p_discount_type not in ('fixed', 'percent') then
      raise exception 'Unknown discount type.';
    end if;
    if p_discount_value is null or p_discount_value <= 0 then
      raise exception 'Discount value must be greater than 0.';
    end if;
    if p_discount_type = 'percent' and p_discount_value > 100 then
      raise exception 'A percentage discount cannot exceed 100%%.';
    end if;
    if p_discount_type = 'fixed' and p_discount_value > p_price_amount then
      raise exception 'A fixed discount cannot exceed the price.';
    end if;
    if p_discount_type = 'fixed'
       and p_child_price_amount is not null
       and p_discount_value > p_child_price_amount then
      raise exception 'A fixed discount cannot exceed the child price.';
    end if;
  elsif p_discount_value is not null then
    raise exception 'Choose a discount type or clear the value.';
  end if;

  update public.sessions
  set
    price_currency     = p_price_currency,
    price_amount       = p_price_amount,
    child_price_amount = p_child_price_amount,
    discount_type      = p_discount_type,
    discount_value     = case when p_discount_type is null then null else p_discount_value end
  where id = p_session_id;
end;
$$;

comment on function public.set_session_pricing(uuid, text, numeric, text, numeric, numeric) is
  'Lets an instructor set price, child price and discount on their own class. Definer rather than an RLS update policy because RLS cannot limit which columns are written, and everything else about a session stays admin-owned.';

drop function if exists public.set_session_pricing(uuid, text, numeric, text, numeric);

revoke all on function public.set_session_pricing(uuid, text, numeric, text, numeric, numeric) from public;
revoke all on function public.set_session_pricing(uuid, text, numeric, text, numeric, numeric) from anon;
grant execute on function public.set_session_pricing(uuid, text, numeric, text, numeric, numeric)
  to authenticated, service_role;
