-- Waitlist for fully-booked sessions.
-- When a cancellation frees a spot, all un-notified entries for that session
-- receive an email (sent from the app layer). Each entry is notified at most once.

-- ---------------------------------------------------------------------------
-- 1. Table
-- ---------------------------------------------------------------------------

create table if not exists public.waitlist_entries (
  id           uuid primary key default gen_random_uuid(),
  session_id   uuid not null references public.sessions(id) on delete cascade,
  user_id      uuid references auth.users(id) on delete set null,
  guest_name   text not null,
  guest_email  text not null,
  guest_phone  text,
  notified_at  timestamptz,                      -- null = not yet notified
  created_at   timestamptz not null default now(),
  constraint waitlist_entries_guest_name_nonempty check (trim(guest_name) <> ''),
  constraint waitlist_entries_guest_email_normalized check (
    guest_email = public.normalize_email(guest_email)
  )
);

-- One active (un-notified) entry per email per session
create unique index if not exists waitlist_entries_session_email_active_idx
  on public.waitlist_entries (session_id, guest_email)
  where notified_at is null;

-- One active entry per member per session
create unique index if not exists waitlist_entries_session_user_active_idx
  on public.waitlist_entries (session_id, user_id)
  where notified_at is null and user_id is not null;

create index if not exists waitlist_entries_session_id_idx
  on public.waitlist_entries (session_id);

create index if not exists waitlist_entries_notified_at_idx
  on public.waitlist_entries (session_id, notified_at)
  where notified_at is null;

alter table public.waitlist_entries enable row level security;

-- Members can read their own entries
create policy "member read own waitlist entries"
  on public.waitlist_entries for select
  to authenticated
  using (user_id = auth.uid());

-- Admin full access
create policy "admin all on waitlist_entries"
  on public.waitlist_entries for all
  to authenticated
  using (public.is_admin_user())
  with check (public.is_admin_user());

-- ---------------------------------------------------------------------------
-- 2. RPC: join_waitlist
-- ---------------------------------------------------------------------------

create or replace function public.join_waitlist(
  p_session_id  uuid,
  p_guest_name  text,
  p_guest_email text,
  p_guest_phone text default null,
  p_user_id     uuid default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_session public.sessions%rowtype;
  v_email   text;
  v_id      uuid;
begin
  v_email := public.normalize_email(p_guest_email);

  if v_email = '' or trim(p_guest_name) = '' then
    raise exception 'Name and email are required.';
  end if;

  select *
  into v_session
  from public.sessions
  where id = p_session_id;

  if not found then
    raise exception 'Session not found.';
  end if;

  if v_session.status <> 'confirmed' or not v_session.is_published then
    raise exception 'Session is not available.';
  end if;

  if v_session.starts_at <= now() then
    raise exception 'Session has already started.';
  end if;

  -- Reject if already has an active booking for this session
  if exists (
    select 1 from public.bookings b
    where b.session_id = p_session_id
      and b.status = 'confirmed'
      and (
        b.guest_email = v_email
        or (p_user_id is not null and b.user_id = p_user_id)
      )
  ) then
    raise exception 'You already have a booking for this session.';
  end if;

  -- Upsert: if already on waitlist (un-notified), update name/phone
  insert into public.waitlist_entries (
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
    nullif(trim(coalesce(p_guest_phone, '')), '')
  )
  on conflict (session_id, guest_email) where notified_at is null
  do update set
    guest_name  = excluded.guest_name,
    guest_phone = excluded.guest_phone,
    user_id     = excluded.user_id
  returning id into v_id;

  return v_id;
end;
$$;

-- ---------------------------------------------------------------------------
-- 3. RPC: get_waitlist_entries_to_notify
--    Returns un-notified entries for a session and marks them notified atomically.
-- ---------------------------------------------------------------------------

create or replace function public.get_waitlist_entries_to_notify(
  p_session_id uuid
)
returns table (
  id          uuid,
  guest_name  text,
  guest_email text
)
language plpgsql
security definer
set search_path = public
as $$
begin
  return query
    update public.waitlist_entries
    set notified_at = now()
    where session_id = p_session_id
      and notified_at is null
    returning
      public.waitlist_entries.id,
      public.waitlist_entries.guest_name,
      public.waitlist_entries.guest_email;
end;
$$;

-- ---------------------------------------------------------------------------
-- 4. RPC: delete_waitlist_entry (admin only)
-- ---------------------------------------------------------------------------

create or replace function public.delete_waitlist_entry(p_entry_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin_user() then
    raise exception 'Admin access required.';
  end if;

  delete from public.waitlist_entries where id = p_entry_id;
end;
$$;

-- ---------------------------------------------------------------------------
-- 5. Grants
-- ---------------------------------------------------------------------------

revoke all on function public.join_waitlist(uuid, text, text, text, uuid) from public;
revoke all on function public.get_waitlist_entries_to_notify(uuid) from public;
revoke all on function public.delete_waitlist_entry(uuid) from public;

grant execute on function public.join_waitlist(uuid, text, text, text, uuid)
  to service_role, anon, authenticated;

grant execute on function public.get_waitlist_entries_to_notify(uuid)
  to service_role;

grant execute on function public.delete_waitlist_entry(uuid)
  to service_role, authenticated;
