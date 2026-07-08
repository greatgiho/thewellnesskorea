-- Session pricing: single `price_krw` (integer won) -> `price_currency` + `price_amount`.
-- Going forward pricing is effectively USD; existing rows are treated as KRW.
-- Also carries currency/decimal through the booking-hold payment path.

alter table public.sessions
  add column price_currency text not null default 'USD',
  add column price_amount numeric(12,2) not null default 0;

-- Existing data was won-denominated.
update public.sessions
  set price_currency = 'KRW',
      price_amount = price_krw;

alter table public.sessions
  add constraint sessions_price_currency_check
  check (price_currency in ('KRW', 'USD'));

alter table public.sessions drop column price_krw;

-- Payments carry the same money type (was integer won).
alter table public.payments alter column amount type numeric(12,2);

-- create_booking (free path): only gate reference to the price.
create or replace function public.create_booking(
  p_session_id uuid,
  p_guest_name text,
  p_guest_email text,
  p_guest_phone text default null,
  p_user_id uuid default null
) returns table(booking_id uuid, cancel_token text)
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  v_session public.sessions%rowtype;
  v_email text;
  v_booking_id uuid;
  v_cancel_token text;
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

  if v_session.price_amount > 0 then
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

-- create_booking_hold (paid path): return type changes (amount integer -> numeric),
-- so drop + recreate. Now uses the session's currency + amount.
drop function if exists public.create_booking_hold(uuid, text, text, text, uuid, text, integer);

create function public.create_booking_hold(
  p_session_id uuid,
  p_guest_name text,
  p_guest_email text,
  p_guest_phone text default null,
  p_user_id uuid default null,
  p_pg_provider text default 'portone',
  p_hold_minutes integer default 10
) returns table(
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

  if v_session.price_amount <= 0 then
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
    v_session.price_amount, v_session.price_currency, 'pending'
  );

  update public.sessions set booked_count = booked_count + 1 where id = p_session_id;

  return query
  select v_booking_id, v_cancel_token, v_merchant_uid, v_session.price_amount, v_expires;
end;
$function$;

revoke all on function public.create_booking_hold(uuid, text, text, text, uuid, text, integer) from public;
grant execute on function public.create_booking_hold(uuid, text, text, text, uuid, text, integer)
  to anon, authenticated, service_role;
