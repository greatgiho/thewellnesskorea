-- One booking can bring people with it.
--
-- 053 gave a booking an attendee_type, which made a family two bookings on one
-- email address and two separate payments. What people actually do is book for
-- their household in one go and pay once, so a booking becomes a party: some
-- adults, some children, one charge, one ticket.
--
-- attendee_type is replaced rather than kept alongside. A row that says both
-- 'child' and "2 adults, 1 child" has two answers to the same question, and
-- the counts subsume it: a lone child ticket is (0, 1). 053 only ever reached
-- the dev clone, so there is no production data behind the old column.

alter table public.bookings
  add column if not exists adult_count int not null default 1,
  add column if not exists child_count int not null default 0;

-- Carry 053's shape over before the column goes.
update public.bookings
   set adult_count = case when attendee_type = 'child' then 0 else 1 end,
       child_count = case when attendee_type = 'child' then 1 else 0 end
 where attendee_type is not null;

alter table public.bookings drop constraint if exists bookings_attendee_type_check;
alter table public.bookings drop column if exists attendee_type;

alter table public.bookings
  drop constraint if exists bookings_party_counts_check;
alter table public.bookings
  add constraint bookings_party_counts_check
  check (
    adult_count >= 0
    and child_count >= 0
    -- A booking for nobody is not a booking, and a party larger than this is
    -- a group enquiry rather than a self-service reservation.
    and adult_count + child_count between 1 and 10
  );

comment on column public.bookings.adult_count is
  'People on this booking charged the adult rate. With child_count, the number of seats it occupies.';
comment on column public.bookings.child_count is
  'People on this booking charged the child rate. Requires the session to have a child rate.';

-- 053 widened the duplicate-booking key to include the attendee type, so that
-- a parent could book their own seat and their child's as two bookings. A
-- party is one booking, so the original rule is the right one again: one live
-- booking per person per class.
drop index if exists public.bookings_session_guest_email_attendee_active_idx;
create unique index if not exists bookings_session_guest_email_active_idx
  on public.bookings (session_id, guest_email)
  where status = 'confirmed';

drop index if exists public.bookings_session_user_attendee_active_idx;
create unique index if not exists bookings_session_user_active_idx
  on public.bookings (session_id, user_id)
  where status = 'confirmed' and user_id is not null;

-- ---------------------------------------------------------------------------
-- Seats: one owner.
--
-- sessions.booked_count was maintained by hand in six places — two booking
-- functions adding 1, and four cancel/expiry paths subtracting 1. That worked
-- only while a booking was always exactly one seat, and every one of the six
-- would now have to learn about party size and stay in step forever. The
-- previous change to this area already shipped a regression by rebuilding one
-- of these functions from the wrong ancestor.
--
-- So the column stops being something callers maintain. A trigger recomputes
-- it from the bookings themselves, which also means any drift already in the
-- data heals on the next write to that session rather than persisting.
--
-- Recompute rather than apply a delta: a delta has to be right about the
-- transition it is reacting to (confirmed -> cancelled -> confirmed, a party
-- resized, a row deleted outright), and a sum cannot be wrong about any of it.
-- ---------------------------------------------------------------------------

create or replace function public.recount_session_seats(p_session_id uuid)
returns void
language sql
security definer
set search_path = public
as $$
  update public.sessions s
     set booked_count = coalesce((
           select sum(b.adult_count + b.child_count)
             from public.bookings b
            where b.session_id = s.id
              and (b.status = 'confirmed' or public.is_booking_hold_active(b))
         ), 0)
   where s.id = p_session_id;
$$;

comment on function public.recount_session_seats is
  'Sets sessions.booked_count to the seats actually held by live bookings. The bookings trigger is the only thing that should need to call this.';

create or replace function public.sync_session_seats()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  -- A booking moved between sessions would leave the old one overcounted.
  if tg_op = 'UPDATE' and new.session_id is distinct from old.session_id then
    perform public.recount_session_seats(old.session_id);
  end if;

  if tg_op = 'DELETE' then
    perform public.recount_session_seats(old.session_id);
    return old;
  end if;

  perform public.recount_session_seats(new.session_id);
  return new;
end;
$$;

drop trigger if exists bookings_sync_session_seats on public.bookings;
create trigger bookings_sync_session_seats
  after insert or delete or
  update of status, adult_count, child_count, session_id, expires_at
  on public.bookings
  for each row execute function public.sync_session_seats();

-- ---------------------------------------------------------------------------
-- The four cancel/expiry paths stop touching booked_count.
--
-- Copied verbatim from 022 with only the seat arithmetic removed — the trigger
-- now does it, and leaving both would double-count. Nothing else about them
-- changes.
-- ---------------------------------------------------------------------------

create or replace function public.expire_stale_booking_holds()
returns int
language plpgsql
security definer
set search_path = public
as $$
declare
  v_row record;
  v_count int := 0;
begin
  for v_row in
    select b.id as booking_id, b.session_id
    from public.bookings b
    where b.status = 'pending_payment'
      and b.expires_at is not null
      and b.expires_at <= now()
    for update of b
  loop
    update public.bookings
    set
      status = 'cancelled',
      cancelled_at = now(),
      expires_at = null
    where id = v_row.booking_id;

    update public.payments p
    set
      status = 'failed',
      cancelled_at = coalesce(p.cancelled_at, now())
    where p.booking_id = v_row.booking_id
      and p.status = 'pending';

    v_count := v_count + 1;
  end loop;

  return v_count;
end;
$$;

create or replace function public.cancel_booking_by_token(p_cancel_token text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_booking public.bookings%rowtype;
begin
  if trim(p_cancel_token) = '' then
    raise exception 'Cancel token is required.';
  end if;

  select *
  into v_booking
  from public.bookings
  where cancel_token = p_cancel_token
  for update;

  if not found then
    raise exception 'Booking not found.';
  end if;

  if v_booking.status not in ('confirmed', 'pending_payment') then
    return v_booking.id;
  end if;

  update public.bookings
  set
    status = 'cancelled',
    cancelled_at = now(),
    expires_at = null
  where id = v_booking.id;

  update public.payments
  set
    status = case when status = 'pending' then 'cancelled'::public.payment_status else status end,
    cancelled_at = coalesce(cancelled_at, now())
  where booking_id = v_booking.id
    and status = 'pending';

  return v_booking.id;
end;
$$;

create or replace function public.cancel_booking_for_user(
  p_booking_id uuid,
  p_user_id uuid
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_booking public.bookings%rowtype;
begin
  select *
  into v_booking
  from public.bookings
  where id = p_booking_id
    and user_id = p_user_id
  for update;

  if not found then
    raise exception 'Booking not found.';
  end if;

  if v_booking.status not in ('confirmed', 'pending_payment') then
    return v_booking.id;
  end if;

  update public.bookings
  set
    status = 'cancelled',
    cancelled_at = now(),
    expires_at = null
  where id = v_booking.id;

  update public.payments
  set
    status = case when status = 'pending' then 'cancelled'::public.payment_status else status end,
    cancelled_at = coalesce(cancelled_at, now())
  where booking_id = v_booking.id
    and status = 'pending';

  return v_booking.id;
end;
$$;

create or replace function public.admin_cancel_booking(p_booking_id uuid)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_booking public.bookings%rowtype;
begin
  if not public.is_admin_user() then
    raise exception 'Admin access required.';
  end if;

  select *
  into v_booking
  from public.bookings
  where id = p_booking_id
  for update;

  if not found then
    raise exception 'Booking not found.';
  end if;

  if v_booking.status not in ('confirmed', 'pending_payment') then
    return v_booking.id;
  end if;

  update public.bookings
  set
    status = 'cancelled',
    cancelled_at = now(),
    expires_at = null
  where id = v_booking.id;

  update public.payments
  set
    status = case when status = 'pending' then 'cancelled'::public.payment_status else status end,
    cancelled_at = coalesce(cancelled_at, now())
  where booking_id = v_booking.id
    and status = 'pending';

  return v_booking.id;
end;
$$;

-- ---------------------------------------------------------------------------
-- What a party costs.
--
-- Each rate is discounted and rounded on its own, then multiplied. Rounding
-- the unit rather than the total is what makes the receipt add up: the
-- customer is shown a per-person price, and two of them must come to exactly
-- twice it.
-- ---------------------------------------------------------------------------

create or replace function public.party_total(
  p_price numeric,
  p_child_price numeric,
  p_currency text,
  p_discount_type text,
  p_discount_value numeric,
  p_adult_count int,
  p_child_count int
)
returns numeric
language sql
immutable
as $$
  select
    p_adult_count * public.session_final_price(
      p_price, p_currency, p_discount_type, p_discount_value
    )
    + p_child_count * public.session_final_price(
      public.session_base_price(p_price, p_child_price, 'child'),
      p_currency, p_discount_type, p_discount_value
    );
$$;

comment on function public.party_total is
  'Order total for a party, each rate discounted and rounded per person before multiplying. Mirrors quoteParty() in lib/payments/money.ts.';

-- List price of the party before any discount, which is what a coupon comes
-- off. Kept separate so the coupon path cannot accidentally discount an
-- already-discounted total.
create or replace function public.party_list_total(
  p_price numeric,
  p_child_price numeric,
  p_adult_count int,
  p_child_count int
)
returns numeric
language sql
immutable
as $$
  select p_adult_count * p_price
       + p_child_count * public.session_base_price(p_price, p_child_price, 'child');
$$;

-- ---------------------------------------------------------------------------
-- check_coupon: one coupon per order, not per person.
--
-- A fixed ₩5,000 coupon means ₩5,000 off, not ₩5,000 off each of four seats.
-- So the coupon comes off the party's list total and competes with the session
-- discount there — the same "best available price, never stacked" rule as
-- before, moved up from the seat to the order.
-- ---------------------------------------------------------------------------

create or replace function public.check_coupon(
  p_code text,
  p_session_id uuid,
  p_email text default null,
  p_lock boolean default false,
  p_adult_count int default 1,
  p_child_count int default 0
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
  v_list_total numeric;
  v_session_final numeric;
  v_coupon_final numeric;
  v_best numeric;
begin
  select * into v_session from public.sessions where id = p_session_id;
  if not found then
    return query select false, 'session_not_found', null::uuid, null::numeric, null::numeric;
    return;
  end if;

  v_list_total := public.party_list_total(
    v_session.price_amount, v_session.child_price_amount,
    p_adult_count, p_child_count
  );

  -- The price to beat: whatever the party already costs after the session's
  -- own discount. A coupon that cannot beat it is not applied.
  v_session_final := public.party_total(
    v_session.price_amount, v_session.child_price_amount, v_session.price_currency,
    v_session.discount_type, v_session.discount_value,
    p_adult_count, p_child_count
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

  v_coupon_final := public.session_final_price(
    v_list_total, v_session.price_currency,
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

comment on function public.check_coupon(text, uuid, text, boolean, int, int) is
  'Validate a coupon against a session and a party. The coupon applies once to the order and competes with the session discount; it never stacks. Returns ok=false with a machine-readable reason rather than raising. Pass p_lock=true inside a booking transaction to hold the coupon row while the usage limit is checked.';

drop function if exists public.check_coupon(text, uuid, text, boolean, text);

revoke all on function public.check_coupon(text, uuid, text, boolean, int, int) from public;
revoke all on function public.check_coupon(text, uuid, text, boolean, int, int) from anon;
revoke all on function public.check_coupon(text, uuid, text, boolean, int, int) from authenticated;
grant execute on function public.check_coupon(text, uuid, text, boolean, int, int) to service_role;

-- ---------------------------------------------------------------------------
-- Booking RPCs take a party.
--
-- Counts, never a price: what the party costs is still computed here from the
-- session row. Capacity is checked against the whole party, so a group of four
-- cannot slip into two remaining seats.
-- ---------------------------------------------------------------------------

create or replace function public.create_booking(
  p_session_id uuid,
  p_guest_name text,
  p_guest_email text,
  p_guest_phone text default null,
  p_user_id uuid default null,
  p_coupon_code text default null,
  p_adult_count int default 1,
  p_child_count int default 0
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
  v_party int;
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

  v_party := coalesce(p_adult_count, 0) + coalesce(p_child_count, 0);

  if p_adult_count < 0 or p_child_count < 0 then
    raise exception 'Party counts cannot be negative.';
  end if;
  if v_party < 1 then
    raise exception 'A booking needs at least one person.';
  end if;
  if v_party > 10 then
    raise exception 'Up to 10 people per booking. Please contact us for a larger group.';
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

  if p_child_count > 0 and v_session.child_price_amount is null then
    raise exception 'This class does not offer a child rate.';
  end if;

  v_amount := public.party_total(
    v_session.price_amount, v_session.child_price_amount, v_session.price_currency,
    v_session.discount_type, v_session.discount_value,
    p_adult_count, p_child_count
  );

  if nullif(btrim(coalesce(p_coupon_code, '')), '') is not null then
    select * into v_coupon
    from public.check_coupon(
      p_coupon_code, p_session_id, v_email, true, p_adult_count, p_child_count
    );
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

  if v_session.booked_count + v_party > v_session.capacity then
    raise exception 'Not enough spots left for % people.', v_party;
  end if;

  if exists (
    select 1 from public.bookings b
    where b.session_id = p_session_id
      and (b.status = 'confirmed' or public.is_booking_hold_active(b))
      and (b.guest_email = v_email or (p_user_id is not null and b.user_id = p_user_id))
  ) then
    raise exception 'You already have a booking for this session.';
  end if;

  insert into public.bookings
    (session_id, user_id, guest_name, guest_email, guest_phone,
     adult_count, child_count)
  values
    (p_session_id, p_user_id, trim(p_guest_name), v_email,
     nullif(trim(p_guest_phone), ''), p_adult_count, p_child_count)
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

  -- booked_count is the trigger's job now.

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
  p_adult_count int default 1,
  p_child_count int default 0
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
  v_party int;
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

  v_party := coalesce(p_adult_count, 0) + coalesce(p_child_count, 0);

  if p_adult_count < 0 or p_child_count < 0 then
    raise exception 'Party counts cannot be negative.';
  end if;
  if v_party < 1 then
    raise exception 'A booking needs at least one person.';
  end if;
  if v_party > 10 then
    raise exception 'Up to 10 people per booking. Please contact us for a larger group.';
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

  if p_child_count > 0 and v_session.child_price_amount is null then
    raise exception 'This class does not offer a child rate.';
  end if;

  v_amount := public.party_total(
    v_session.price_amount, v_session.child_price_amount, v_session.price_currency,
    v_session.discount_type, v_session.discount_value,
    p_adult_count, p_child_count
  );

  if nullif(btrim(coalesce(p_coupon_code, '')), '') is not null then
    select * into v_coupon
    from public.check_coupon(
      p_coupon_code, p_session_id, v_email, true, p_adult_count, p_child_count
    );
    if not v_coupon.ok and v_coupon.reason is distinct from 'not_better' then
      raise exception 'Coupon cannot be used: %', v_coupon.reason;
    end if;
    if v_coupon.ok then
      v_has_coupon := true;
      v_amount := v_coupon.final_amount;
    end if;
  end if;

  -- Guard on what is actually charged: a party of children at a zero child
  -- rate, a coupon, or a full discount all make this free, and a free booking
  -- goes through create_booking instead.
  if v_amount <= 0 then
    raise exception 'This session does not require online payment. Use create_booking instead.';
  end if;

  if v_session.booked_count + v_party > v_session.capacity then
    raise exception 'Not enough spots left for % people.', v_party;
  end if;

  if exists (
    select 1 from public.bookings b
    where b.session_id = p_session_id
      and (b.status = 'confirmed' or public.is_booking_hold_active(b))
      and (b.guest_email = v_email or (p_user_id is not null and b.user_id = p_user_id))
  ) then
    raise exception 'You already have a booking for this session.';
  end if;

  v_expires := now() + make_interval(mins => p_hold_minutes);
  v_merchant_uid := 'twk-' || replace(gen_random_uuid()::text, '-', '');

  insert into public.bookings (
    session_id, user_id, guest_name, guest_email, guest_phone,
    adult_count, child_count, status, expires_at
  )
  values (
    p_session_id, p_user_id, trim(p_guest_name), v_email,
    nullif(trim(p_guest_phone), ''), p_adult_count, p_child_count,
    'pending_payment', v_expires
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

  return query
  select v_booking_id, v_cancel_token, v_merchant_uid, v_amount, v_expires;
end;
$function$;

-- The 053 signatures took an attendee type; they would otherwise be picked by
-- name-matched calls and book one seat for a party of four.
drop function if exists public.create_booking(uuid, text, text, text, uuid, text, text);
drop function if exists public.create_booking_hold(uuid, text, text, text, uuid, text, integer, text, text);

revoke all on function public.create_booking_hold(uuid, text, text, text, uuid, text, integer, text, int, int) from public;
revoke all on function public.create_booking_hold(uuid, text, text, text, uuid, text, integer, text, int, int) from anon;
revoke all on function public.create_booking_hold(uuid, text, text, text, uuid, text, integer, text, int, int) from authenticated;
grant execute on function public.create_booking_hold(uuid, text, text, text, uuid, text, integer, text, int, int)
  to service_role;

grant execute on function public.create_booking(uuid, text, text, text, uuid, text, int, int)
  to anon, authenticated, service_role;

-- Bring every session's seat count in line with the rule the trigger now
-- enforces, so the change does not leave old drift behind.
update public.sessions s
   set booked_count = coalesce((
         select sum(b.adult_count + b.child_count)
           from public.bookings b
          where b.session_id = s.id
            and (b.status = 'confirmed' or public.is_booking_hold_active(b))
       ), 0);
