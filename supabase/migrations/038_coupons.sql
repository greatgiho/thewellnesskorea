-- Coupon codes.
--
-- A coupon competes with the per-session discount rather than stacking with
-- it: the customer gets whichever is cheaper, once. Stacking two 50% offers
-- into 75% off is the kind of thing that only shows up on the invoice, and
-- "best available price" is both easy to explain and impossible to exploit.
--
-- Validation and redemption both happen inside the booking transaction. The
-- code cannot be trusted from the client, and the usage limit is a race:
-- without a lock, two people redeeming the last one both see a count below
-- the cap and both succeed.

create table if not exists public.coupons (
  id                uuid primary key default gen_random_uuid(),
  code              text not null,
  discount_type     text not null check (discount_type in ('fixed', 'percent')),
  discount_value    numeric(12,2) not null check (discount_value > 0),
  -- A fixed discount is an amount, so it only means something in a currency.
  currency          text check (currency in ('KRW', 'USD')),
  -- Scope: both null = every class. At most one may be set.
  experience_id     uuid references public.experiences(id) on delete cascade,
  session_id        uuid references public.sessions(id) on delete cascade,
  starts_at         timestamptz,
  ends_at           timestamptz,
  max_redemptions   int check (max_redemptions is null or max_redemptions > 0),
  max_per_user      int check (max_per_user is null or max_per_user > 0),
  is_active         boolean not null default true,
  note              text,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),

  constraint coupons_percent_range
    check (discount_type <> 'percent' or discount_value <= 100),
  constraint coupons_fixed_needs_currency
    check (discount_type <> 'fixed' or currency is not null),
  constraint coupons_single_scope
    check (num_nulls(experience_id, session_id) >= 1),
  constraint coupons_window_order
    check (starts_at is null or ends_at is null or starts_at <= ends_at)
);

-- Codes are matched case- and whitespace-insensitively, so uniqueness has to
-- be enforced on the normalized form or 'SUMMER' and 'summer' both exist.
create unique index if not exists coupons_code_key
  on public.coupons (upper(btrim(code)));

drop trigger if exists coupons_updated_at on public.coupons;
create trigger coupons_updated_at
  before update on public.coupons
  for each row execute function public.set_updated_at();

create table if not exists public.coupon_redemptions (
  id                uuid primary key default gen_random_uuid(),
  coupon_id         uuid not null references public.coupons(id) on delete cascade,
  -- Cancelling a booking must free the redemption back up, so this cascades
  -- and a trigger clears it when a booking is cancelled rather than deleted.
  booking_id        uuid not null references public.bookings(id) on delete cascade,
  user_id           uuid references auth.users(id) on delete set null,
  -- Bookings can be made without an account, so per-person limits count by
  -- email; user_id is only there when the booker was signed in.
  email             text not null,
  amount_discounted numeric(12,2) not null check (amount_discounted >= 0),
  created_at        timestamptz not null default now(),

  -- One coupon per booking.
  constraint coupon_redemptions_booking_key unique (booking_id)
);

create index if not exists coupon_redemptions_coupon_idx
  on public.coupon_redemptions (coupon_id);
create index if not exists coupon_redemptions_coupon_email_idx
  on public.coupon_redemptions (coupon_id, email);

alter table public.coupons enable row level security;
alter table public.coupon_redemptions enable row level security;

-- Coupons are never readable from the client: a public select would let
-- anyone enumerate every active code. Validation goes through the RPC below,
-- which runs as definer.
drop policy if exists "admin all on coupons" on public.coupons;
create policy "admin all on coupons"
  on public.coupons for all
  to authenticated
  using (public.is_admin_user())
  with check (public.is_admin_user());

drop policy if exists "admin all on coupon_redemptions" on public.coupon_redemptions;
create policy "admin all on coupon_redemptions"
  on public.coupon_redemptions for all
  to authenticated
  using (public.is_admin_user())
  with check (public.is_admin_user());

-- ---------------------------------------------------------------------------
-- Validation
-- ---------------------------------------------------------------------------

create or replace function public.check_coupon(
  p_code text,
  p_session_id uuid,
  p_email text default null,
  p_lock boolean default false
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
  v_session_final numeric;
  v_coupon_final numeric;
  v_best numeric;
begin
  select * into v_session from public.sessions where id = p_session_id;
  if not found then
    return query select false, 'session_not_found', null::uuid, null::numeric, null::numeric;
    return;
  end if;

  -- The price to beat: whatever the class already costs after its own
  -- discount. A coupon that cannot beat it is not applied.
  v_session_final := public.session_final_price(
    v_session.price_amount, v_session.price_currency,
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
    v_session.price_amount, v_session.price_currency,
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

comment on function public.check_coupon is
  'Validate a coupon against a session. Returns ok=false with a machine-readable reason rather than raising, so the booking form can explain the failure. Pass p_lock=true inside a booking transaction to hold the coupon row while the usage limit is checked.';

-- ---------------------------------------------------------------------------
-- Cancelling frees the redemption
--
-- Four paths end a booking (three cancel RPCs plus hold expiry). A trigger on
-- the status column covers all of them, and anything added later, instead of
-- each function remembering to clean up.
-- ---------------------------------------------------------------------------

create or replace function public.release_coupon_on_cancel()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $$
begin
  if new.status = 'cancelled' and old.status is distinct from 'cancelled' then
    delete from public.coupon_redemptions where booking_id = new.id;
  end if;
  return new;
end;
$$;

drop trigger if exists bookings_release_coupon on public.bookings;
create trigger bookings_release_coupon
  after update of status on public.bookings
  for each row execute function public.release_coupon_on_cancel();

revoke all on function public.check_coupon(text, uuid, text, boolean) from public;
revoke all on function public.check_coupon(text, uuid, text, boolean) from anon;
revoke all on function public.check_coupon(text, uuid, text, boolean) from authenticated;
grant execute on function public.check_coupon(text, uuid, text, boolean) to service_role;

-- ---------------------------------------------------------------------------
-- Booking RPCs accept a coupon code
--
-- Validation runs with p_lock => the coupon row is held for the rest of the
-- transaction, so a concurrent booking cannot also pass the usage check. The
-- redemption is written in the same transaction as the booking: either both
-- land or neither does.
-- ---------------------------------------------------------------------------

create or replace function public.create_booking(
  p_session_id uuid,
  p_guest_name text,
  p_guest_email text,
  p_guest_phone text default null,
  p_user_id uuid default null,
  p_coupon_code text default null
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
  v_amount numeric;
  v_coupon record;
begin
  v_email := public.normalize_email(p_guest_email);

  if v_email = '' or trim(p_guest_name) = '' then
    raise exception 'Name and email are required.';
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

  v_amount := public.session_final_price(
    v_session.price_amount, v_session.price_currency,
    v_session.discount_type, v_session.discount_value
  );

  if nullif(btrim(coalesce(p_coupon_code, '')), '') is not null then
    select * into v_coupon
    from public.check_coupon(p_coupon_code, p_session_id, v_email, true);
    -- 'not_better' is not a failure: the class is already cheaper than the
    -- coupon would make it, so book at that price rather than refusing a
    -- customer who would have paid less anyway. Anything else is refused so
    -- they are not charged full price expecting a discount.
    if not v_coupon.ok and v_coupon.reason is distinct from 'not_better' then
      raise exception 'Coupon cannot be used: %', v_coupon.reason;
    end if;
    if v_coupon.ok then
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
      and (b.guest_email = v_email or (p_user_id is not null and b.user_id = p_user_id))
  ) then
    raise exception 'You already have a booking for this session.';
  end if;

  insert into public.bookings (session_id, user_id, guest_name, guest_email, guest_phone)
  values (p_session_id, p_user_id, trim(p_guest_name), v_email, nullif(trim(p_guest_phone), ''))
  returning public.bookings.id, public.bookings.cancel_token
  into v_booking_id, v_cancel_token;

  if v_coupon.ok then
    insert into public.coupon_redemptions
      (coupon_id, booking_id, user_id, email, amount_discounted)
    values
      (v_coupon.coupon_id, v_booking_id, p_user_id, v_email, v_coupon.discount_amount);
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
  p_coupon_code text default null
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
  v_amount numeric;
  v_coupon record;
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

  v_amount := public.session_final_price(
    v_session.price_amount, v_session.price_currency,
    v_session.discount_type, v_session.discount_value
  );

  if nullif(btrim(coalesce(p_coupon_code, '')), '') is not null then
    select * into v_coupon
    from public.check_coupon(p_coupon_code, p_session_id, v_email, true);
    -- 'not_better' is not a failure: the class is already cheaper than the
    -- coupon would make it, so book at that price rather than refusing a
    -- customer who would have paid less anyway. Anything else is refused so
    -- they are not charged full price expecting a discount.
    if not v_coupon.ok and v_coupon.reason is distinct from 'not_better' then
      raise exception 'Coupon cannot be used: %', v_coupon.reason;
    end if;
    if v_coupon.ok then
      v_amount := v_coupon.final_amount;
    end if;
  end if;

  -- Guard on what is actually charged: a coupon can take this to zero, and a
  -- free class books through create_booking instead.
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
      and (b.guest_email = v_email or (p_user_id is not null and b.user_id = p_user_id))
  ) then
    raise exception 'You already have a booking for this session.';
  end if;

  v_expires := now() + make_interval(mins => p_hold_minutes);
  v_merchant_uid := 'twk-' || replace(gen_random_uuid()::text, '-', '');

  insert into public.bookings (
    session_id, user_id, guest_name, guest_email, guest_phone, status, expires_at
  )
  values (
    p_session_id, p_user_id, trim(p_guest_name), v_email,
    nullif(trim(p_guest_phone), ''), 'pending_payment', v_expires
  )
  returning public.bookings.id, public.bookings.cancel_token
  into v_booking_id, v_cancel_token;

  if v_coupon.ok then
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
-- and be picked by callers that omit the coupon.
drop function if exists public.create_booking(uuid, text, text, text, uuid);
drop function if exists public.create_booking_hold(uuid, text, text, text, uuid, text, integer);

revoke all on function public.create_booking_hold(uuid, text, text, text, uuid, text, integer, text) from public;
revoke all on function public.create_booking_hold(uuid, text, text, text, uuid, text, integer, text) from anon;
revoke all on function public.create_booking_hold(uuid, text, text, text, uuid, text, integer, text) from authenticated;
grant execute on function public.create_booking_hold(uuid, text, text, text, uuid, text, integer, text)
  to service_role;

grant execute on function public.create_booking(uuid, text, text, text, uuid, text)
  to anon, authenticated, service_role;
