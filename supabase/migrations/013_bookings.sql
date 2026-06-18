-- Bookings + members + RPC for safe booked_count updates

do $$ begin
  create type public.booking_status as enum (
    'confirmed',
    'cancelled',
    'no_show'
  );
exception
  when duplicate_object then null;
end $$;

create or replace function public.normalize_email(email text)
returns text
language sql
immutable
as $$
  select lower(trim(email));
$$;

-- ---------------------------------------------------------------------------
-- members (participant accounts — separate from people / teachers)
-- ---------------------------------------------------------------------------

create table if not exists public.members (
  id          uuid primary key references auth.users(id) on delete cascade,
  name        text not null,
  phone       text,
  locale      text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  constraint members_name_nonempty check (trim(name) <> '')
);

create trigger members_updated_at
  before update on public.members
  for each row execute function public.set_updated_at();

alter table public.members enable row level security;

create policy "member read own members"
  on public.members for select
  to authenticated
  using (id = auth.uid());

create policy "member update own members"
  on public.members for update
  to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

create policy "admin all on members"
  on public.members for all
  to authenticated
  using (public.is_admin_user())
  with check (public.is_admin_user());

-- ---------------------------------------------------------------------------
-- bookings
-- ---------------------------------------------------------------------------

create table if not exists public.bookings (
  id           uuid primary key default gen_random_uuid(),
  session_id   uuid not null references public.sessions(id) on delete restrict,
  user_id      uuid references auth.users(id) on delete set null,
  guest_name   text not null,
  guest_email  text not null,
  guest_phone  text,
  status       public.booking_status not null default 'confirmed',
  cancelled_at timestamptz,
  cancel_token text not null unique default encode(gen_random_bytes(32), 'hex'),
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  constraint bookings_guest_name_nonempty check (trim(guest_name) <> ''),
  constraint bookings_guest_email_normalized check (
    guest_email = public.normalize_email(guest_email)
  )
);

create index if not exists bookings_session_id_idx
  on public.bookings (session_id);

create index if not exists bookings_user_id_idx
  on public.bookings (user_id)
  where user_id is not null;

create index if not exists bookings_guest_email_idx
  on public.bookings (guest_email);

create unique index if not exists bookings_session_guest_email_active_idx
  on public.bookings (session_id, guest_email)
  where status = 'confirmed';

create unique index if not exists bookings_session_user_active_idx
  on public.bookings (session_id, user_id)
  where status = 'confirmed' and user_id is not null;

create trigger bookings_updated_at
  before update on public.bookings
  for each row execute function public.set_updated_at();

alter table public.bookings enable row level security;

create policy "member read own bookings"
  on public.bookings for select
  to authenticated
  using (user_id = auth.uid());

create policy "admin all on bookings"
  on public.bookings for all
  to authenticated
  using (public.is_admin_user())
  with check (public.is_admin_user());

-- sessions.booked_count must not exceed capacity
alter table public.sessions
  drop constraint if exists sessions_booked_within_capacity;

alter table public.sessions
  add constraint sessions_booked_within_capacity
  check (booked_count <= capacity);

-- ---------------------------------------------------------------------------
-- RPC: create booking (guest or member) in one transaction
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

  if v_session.booked_count >= v_session.capacity then
    raise exception 'Session is full.';
  end if;

  if exists (
    select 1
    from public.bookings b
    where b.session_id = p_session_id
      and b.status = 'confirmed'
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
  returning id, cancel_token into v_booking_id, v_cancel_token;

  update public.sessions
  set booked_count = booked_count + 1
  where id = p_session_id;

  return query select v_booking_id, v_cancel_token;
end;
$$;

-- ---------------------------------------------------------------------------
-- RPC: cancel by token (guest, no login)
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

  if v_booking.status <> 'confirmed' then
    return v_booking.id;
  end if;

  update public.bookings
  set
    status = 'cancelled',
    cancelled_at = now()
  where id = v_booking.id;

  update public.sessions
  set booked_count = greatest(booked_count - 1, 0)
  where id = v_booking.session_id;

  return v_booking.id;
end;
$$;

-- ---------------------------------------------------------------------------
-- RPC: cancel by booking id (logged-in member)
-- ---------------------------------------------------------------------------

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

  if v_booking.status <> 'confirmed' then
    return v_booking.id;
  end if;

  update public.bookings
  set
    status = 'cancelled',
    cancelled_at = now()
  where id = v_booking.id;

  update public.sessions
  set booked_count = greatest(booked_count - 1, 0)
  where id = v_booking.session_id;

  return v_booking.id;
end;
$$;

-- ---------------------------------------------------------------------------
-- RPC: admin cancel (B6 — usable from admin UI later)
-- ---------------------------------------------------------------------------

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

  if v_booking.status <> 'confirmed' then
    return v_booking.id;
  end if;

  update public.bookings
  set
    status = 'cancelled',
    cancelled_at = now()
  where id = v_booking.id;

  update public.sessions
  set booked_count = greatest(booked_count - 1, 0)
  where id = v_booking.session_id;

  return v_booking.id;
end;
$$;

revoke all on function public.create_booking(uuid, text, text, text, uuid) from public;
revoke all on function public.cancel_booking_by_token(text) from public;
revoke all on function public.cancel_booking_for_user(uuid, uuid) from public;
revoke all on function public.admin_cancel_booking(uuid) from public;

grant execute on function public.create_booking(uuid, text, text, text, uuid)
  to service_role;

grant execute on function public.cancel_booking_by_token(text)
  to service_role, anon, authenticated;

grant execute on function public.cancel_booking_for_user(uuid, uuid)
  to service_role, authenticated;

grant execute on function public.admin_cancel_booking(uuid)
  to service_role, authenticated;
