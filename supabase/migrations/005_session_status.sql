-- Session workflow: processing (competing) vs confirmed

create type public.session_status as enum (
  'processing',
  'confirmed',
  'cancelled'
);

alter table public.sessions
  add column if not exists status public.session_status not null default 'processing',
  add column if not exists slot_lane smallint not null default 0
    check (slot_lane between 0 and 1),
  add column if not exists confirmed_at timestamptz,
  add column if not exists confirmed_by uuid references auth.users(id),
  add column if not exists created_by uuid references auth.users(id),
  add column if not exists created_by_email text,
  add column if not exists cancelled_at timestamptz,
  add column if not exists cancelled_by uuid references auth.users(id),
  add column if not exists cancel_reason text;

create index if not exists sessions_status_starts_idx
  on public.sessions (status, starts_at);

-- Existing rows were treated as finalized schedules
update public.sessions
set
  status = 'confirmed',
  slot_lane = 0,
  confirmed_at = coalesce(confirmed_at, updated_at)
where status = 'processing';

drop policy if exists "public read published sessions" on public.sessions;

create policy "public read published sessions"
  on public.sessions for select
  using (is_published = true and status = 'confirmed');
