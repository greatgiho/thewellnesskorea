-- Per-session discount: a fixed amount off, or a percentage off.
--
-- The price a booking is charged is computed inside create_booking_hold from
-- the session row, never sent by the client, so the discount has to be applied
-- in the same place. Putting the arithmetic in a SQL function rather than
-- inlining it means the hold path and anything else that needs the final
-- price agree by construction.
--
-- Rounding mirrors roundMoney() in lib/payments/money.ts: KRW has no subunit,
-- USD goes to cents. The two must match — confirm_booking_payment rejects a
-- capture whose amount differs from the stored one, and the price shown to the
-- customer comes from the TypeScript side.

alter table public.sessions
  add column if not exists discount_type text,
  add column if not exists discount_value numeric(12,2);

alter table public.sessions
  drop constraint if exists sessions_discount_type_check;
alter table public.sessions
  add constraint sessions_discount_type_check
  check (discount_type is null or discount_type in ('fixed', 'percent'));

-- Both columns travel together: a type with no value (or the reverse) would
-- silently mean "no discount" and hide a broken edit.
alter table public.sessions
  drop constraint if exists sessions_discount_pair_check;
alter table public.sessions
  add constraint sessions_discount_pair_check
  check (num_nulls(discount_type, discount_value) in (0, 2));

-- A percentage is 0–100; a fixed amount may not exceed the price, so the
-- discounted total can never go negative.
alter table public.sessions
  drop constraint if exists sessions_discount_value_check;
alter table public.sessions
  add constraint sessions_discount_value_check
  check (
    discount_type is null
    or (discount_type = 'percent' and discount_value > 0 and discount_value <= 100)
    or (discount_type = 'fixed' and discount_value > 0 and discount_value <= price_amount)
  );

-- ---------------------------------------------------------------------------
-- Final price for a session, after any discount.
-- ---------------------------------------------------------------------------

create or replace function public.session_final_price(
  p_price numeric,
  p_currency text,
  p_discount_type text,
  p_discount_value numeric
)
returns numeric
language sql
immutable
as $$
  select greatest(
    0,
    round(
      case
        when p_discount_type = 'percent' then p_price - (p_price * p_discount_value / 100)
        when p_discount_type = 'fixed'   then p_price - p_discount_value
        else p_price
      end,
      case when p_currency = 'KRW' then 0 else 2 end
    )
  );
$$;

comment on function public.session_final_price is
  'Price after discount, rounded to what the currency can be charged in (KRW whole, USD cents). Mirrors roundMoney()/applyDiscount() in lib/payments/money.ts; the two must agree or a capture will fail the amount check.';

-- ---------------------------------------------------------------------------
-- create_booking: accept anything that is not an online payment.
--
-- This guard was `price_amount > 0` — written when "priced" and "pays online"
-- were the same thing. Since the currency split (#64) the app routes on-site
-- classes here too, and they are priced, so every on-site booking has been
-- failing with 'Online payment required'. Verified against the live function:
-- a KRW 30,000 session raises rather than booking.
--
-- The rule that actually holds is paymentMode() in lib/payments/money.ts:
-- online means a USD price above zero. Free (including fully discounted) and
-- non-USD both belong here.
-- ---------------------------------------------------------------------------

create or replace function public.create_booking(
  p_session_id uuid,
  p_guest_name text,
  p_guest_email text,
  p_guest_phone text default null,
  p_user_id uuid default null
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
    v_session.price_amount,
    v_session.price_currency,
    v_session.discount_type,
    v_session.discount_value
  );

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

  update public.sessions set booked_count = booked_count + 1 where id = p_session_id;

  return query select v_booking_id, v_cancel_token;
end;
$function$;

-- ---------------------------------------------------------------------------
-- create_booking_hold: charge the discounted price.
-- ---------------------------------------------------------------------------

create or replace function public.create_booking_hold(
  p_session_id uuid,
  p_guest_name text,
  p_guest_email text,
  p_guest_phone text default null,
  p_user_id uuid default null,
  p_pg_provider text default 'portone',
  p_hold_minutes integer default 10
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
    v_session.price_amount,
    v_session.price_currency,
    v_session.discount_type,
    v_session.discount_value
  );

  -- Guard on the price actually charged, not the list price: a 100% discount
  -- makes this a free class, which books through create_booking instead.
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

revoke all on function public.create_booking_hold(uuid, text, text, text, uuid, text, integer) from public;
revoke all on function public.create_booking_hold(uuid, text, text, text, uuid, text, integer) from anon;
revoke all on function public.create_booking_hold(uuid, text, text, text, uuid, text, integer) from authenticated;
grant execute on function public.create_booking_hold(uuid, text, text, text, uuid, text, integer)
  to service_role;
