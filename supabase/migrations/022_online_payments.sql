-- B7: Online payments (PortOne / Toss etc.)
-- Requires 021_booking_status_pending_payment.sql committed first.
-- Free sessions (price_krw = 0) keep using create_booking (013/019) unchanged.

-- ---------------------------------------------------------------------------
-- 1. Enums
-- ---------------------------------------------------------------------------

do $$ begin
  create type public.payment_status as enum (
    'pending',
    'paid',
    'failed',
    'cancelled'
  );
exception
  when duplicate_object then null;
end $$;

-- ---------------------------------------------------------------------------
-- 2. sessions: price (source of truth for webhook amount verification)
-- ---------------------------------------------------------------------------

alter table public.sessions
  add column if not exists price_krw int not null default 0
    constraint sessions_price_krw_nonneg check (price_krw >= 0);

comment on column public.sessions.price_krw is
  '0 = free / on-site only (create_booking). >0 = online payment required (create_booking_hold).';

-- ---------------------------------------------------------------------------
-- 3. members: lighter signup (JIT name/phone at booking)
-- ---------------------------------------------------------------------------

alter table public.members
  drop constraint if exists members_name_nonempty;

alter table public.members
  alter column name drop not null;

alter table public.members
  add constraint members_name_nonempty
  check (name is null or trim(name) <> '');

-- ---------------------------------------------------------------------------
-- 4. bookings: hold expiry for pending_payment
-- ---------------------------------------------------------------------------

alter table public.bookings
  add column if not exists expires_at timestamptz;

comment on column public.bookings.expires_at is
  'Set when status = pending_payment. Cleared on confirm. Cron expires stale holds.';

create index if not exists bookings_pending_payment_expires_idx
  on public.bookings (expires_at)
  where status = 'pending_payment';

-- ---------------------------------------------------------------------------
-- 5. payments
-- ---------------------------------------------------------------------------

create table if not exists public.payments (
  id            uuid primary key default gen_random_uuid(),
  booking_id    uuid not null references public.bookings(id) on delete cascade,
  merchant_uid  text not null unique,
  pg_provider   text not null,
  amount        int not null check (amount > 0),
  currency      text not null default 'KRW',
  status        public.payment_status not null default 'pending',
  pg_tid        text unique,
  paid_at       timestamptz,
  cancelled_at  timestamptz,
  metadata      jsonb not null default '{}',
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index if not exists payments_booking_id_idx
  on public.payments (booking_id);

create unique index if not exists payments_one_pending_per_booking_idx
  on public.payments (booking_id)
  where status = 'pending';

create trigger payments_updated_at
  before update on public.payments
  for each row execute function public.set_updated_at();

alter table public.payments enable row level security;

drop policy if exists "admin all on payments" on public.payments;
create policy "admin all on payments"
  on public.payments for all
  to authenticated
  using (public.is_admin_user())
  with check (public.is_admin_user());

drop policy if exists "member read own payments" on public.payments;
create policy "member read own payments"
  on public.payments for select
  to authenticated
  using (
    exists (
      select 1 from public.bookings b
      where b.id = payments.booking_id
        and b.user_id = auth.uid()
    )
  );

-- ---------------------------------------------------------------------------
-- 6. Helpers
-- ---------------------------------------------------------------------------

create or replace function public.is_booking_hold_active(p_booking public.bookings)
returns boolean
language sql
stable
as $$
  select
    p_booking.status = 'pending_payment'
    and p_booking.expires_at is not null
    and p_booking.expires_at > now();
$$;

-- ---------------------------------------------------------------------------
-- 7. create_booking: reject paid sessions (free / on-site only)
-- ---------------------------------------------------------------------------

create or replace function public.create_booking(
  p_session_id uuid,
  p_guest_name text,
  p_guest_email text,
  p_guest_phone text default null,
  p_user_id uuid default null
)
returns table (booking_id uuid, cancel_token text)
language plpgsql
security definer
set search_path = public
as $$
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

  select *
  into v_session
  from public.sessions
  where id = p_session_id
  for update;

  if not found then
    raise exception 'Session not found.';
  end if;

  if v_session.status <> 'confirmed' or not v_session.is_published then
    raise exception 'Session is not available for booking.';
  end if;

  if v_session.starts_at <= now() then
    raise exception 'Session has already started or ended.';
  end if;

  if v_session.price_krw > 0 then
    raise exception 'Online payment required. Use create_booking_hold instead.';
  end if;

  if v_session.booked_count >= v_session.capacity then
    raise exception 'Session is full.';
  end if;

  if exists (
    select 1
    from public.bookings b
    where b.session_id = p_session_id
      and (
        b.status = 'confirmed'
        or public.is_booking_hold_active(b)
      )
      and (
        b.guest_email = v_email
        or (p_user_id is not null and b.user_id = p_user_id)
      )
  ) then
    raise exception 'You already have a booking for this session.';
  end if;

  insert into public.bookings (
    session_id,
    user_id,
    guest_name,
    guest_email,
    guest_phone
  )
  values (
    p_session_id,
    p_user_id,
    trim(p_guest_name),
    v_email,
    nullif(trim(p_guest_phone), '')
  )
  returning public.bookings.id, public.bookings.cancel_token
  into v_booking_id, v_cancel_token;

  update public.sessions
  set booked_count = booked_count + 1
  where id = p_session_id;

  return query select v_booking_id, v_cancel_token;
end;
$$;

-- ---------------------------------------------------------------------------
-- 8. RPC: create_booking_hold (paid sessions only)
-- ---------------------------------------------------------------------------

create or replace function public.create_booking_hold(
  p_session_id uuid,
  p_guest_name text,
  p_guest_email text,
  p_guest_phone text default null,
  p_user_id uuid default null,
  p_pg_provider text default 'portone',
  p_hold_minutes int default 10
)
returns table (
  booking_id uuid,
  cancel_token text,
  merchant_uid text,
  amount int,
  expires_at timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
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

  select *
  into v_session
  from public.sessions
  where id = p_session_id
  for update;

  if not found then
    raise exception 'Session not found.';
  end if;

  if v_session.status <> 'confirmed' or not v_session.is_published then
    raise exception 'Session is not available for booking.';
  end if;

  if v_session.starts_at <= now() then
    raise exception 'Session has already started or ended.';
  end if;

  if v_session.price_krw <= 0 then
    raise exception 'This session does not require online payment. Use create_booking instead.';
  end if;

  if v_session.booked_count >= v_session.capacity then
    raise exception 'Session is full.';
  end if;

  if exists (
    select 1
    from public.bookings b
    where b.session_id = p_session_id
      and (
        b.status = 'confirmed'
        or public.is_booking_hold_active(b)
      )
      and (
        b.guest_email = v_email
        or (p_user_id is not null and b.user_id = p_user_id)
      )
  ) then
    raise exception 'You already have a booking for this session.';
  end if;

  v_expires := now() + make_interval(mins => p_hold_minutes);
  v_merchant_uid := 'twk-' || replace(gen_random_uuid()::text, '-', '');

  insert into public.bookings (
    session_id,
    user_id,
    guest_name,
    guest_email,
    guest_phone,
    status,
    expires_at
  )
  values (
    p_session_id,
    p_user_id,
    trim(p_guest_name),
    v_email,
    nullif(trim(p_guest_phone), ''),
    'pending_payment',
    v_expires
  )
  returning public.bookings.id, public.bookings.cancel_token
  into v_booking_id, v_cancel_token;

  insert into public.payments (
    booking_id,
    merchant_uid,
    pg_provider,
    amount,
    currency,
    status
  )
  values (
    v_booking_id,
    v_merchant_uid,
    trim(p_pg_provider),
    v_session.price_krw,
    'KRW',
    'pending'
  );

  update public.sessions
  set booked_count = booked_count + 1
  where id = p_session_id;

  return query
  select v_booking_id, v_cancel_token, v_merchant_uid, v_session.price_krw, v_expires;
end;
$$;

-- ---------------------------------------------------------------------------
-- 9. RPC: confirm_booking_payment (webhook — idempotent)
-- ---------------------------------------------------------------------------

create or replace function public.confirm_booking_payment(
  p_merchant_uid text,
  p_pg_tid text,
  p_pg_provider text,
  p_amount int
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_payment public.payments%rowtype;
  v_booking public.bookings%rowtype;
begin
  if trim(p_merchant_uid) = '' then
    raise exception 'merchant_uid is required.';
  end if;

  select *
  into v_payment
  from public.payments
  where merchant_uid = p_merchant_uid
  for update;

  if not found then
    raise exception 'Payment not found.';
  end if;

  if v_payment.status = 'paid' then
    return v_payment.booking_id;
  end if;

  if v_payment.status <> 'pending' then
    raise exception 'Payment is not pending.';
  end if;

  if p_amount is distinct from v_payment.amount then
    raise exception 'Amount mismatch.';
  end if;

  select *
  into v_booking
  from public.bookings
  where id = v_payment.booking_id
  for update;

  if not found then
    raise exception 'Booking not found.';
  end if;

  if v_booking.status = 'confirmed' then
    return v_booking.id;
  end if;

  if v_booking.status <> 'pending_payment' then
    raise exception 'Booking is not awaiting payment.';
  end if;

  if v_booking.expires_at is null or v_booking.expires_at <= now() then
    raise exception 'Booking hold has expired.';
  end if;

  update public.payments
  set
    status = 'paid',
    pg_tid = nullif(trim(p_pg_tid), ''),
    pg_provider = coalesce(nullif(trim(p_pg_provider), ''), pg_provider),
    paid_at = now()
  where id = v_payment.id;

  update public.bookings
  set
    status = 'confirmed',
    expires_at = null
  where id = v_booking.id;

  return v_booking.id;
end;
$$;

-- ---------------------------------------------------------------------------
-- 10. RPC: expire_stale_booking_holds (Cron — service role)
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

    update public.sessions
    set booked_count = greatest(booked_count - 1, 0)
    where id = v_row.session_id;

    v_count := v_count + 1;
  end loop;

  return v_count;
end;
$$;

-- ---------------------------------------------------------------------------
-- 11. Cancel RPCs: release confirmed or pending_payment holds
-- ---------------------------------------------------------------------------

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

  update public.sessions
  set booked_count = greatest(booked_count - 1, 0)
  where id = v_booking.session_id;

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

  update public.sessions
  set booked_count = greatest(booked_count - 1, 0)
  where id = v_booking.session_id;

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

  update public.sessions
  set booked_count = greatest(booked_count - 1, 0)
  where id = v_booking.session_id;

  return v_booking.id;
end;
$$;

-- ---------------------------------------------------------------------------
-- 12. Grants
-- ---------------------------------------------------------------------------

revoke all on function public.create_booking_hold(uuid, text, text, text, uuid, text, int) from public;
revoke all on function public.confirm_booking_payment(text, text, text, int) from public;
revoke all on function public.expire_stale_booking_holds() from public;

grant execute on function public.create_booking_hold(uuid, text, text, text, uuid, text, int)
  to service_role;

grant execute on function public.confirm_booking_payment(text, text, text, int)
  to service_role;

grant execute on function public.expire_stale_booking_holds()
  to service_role;
