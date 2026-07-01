-- Class board: posts on a per-session basis
-- Author can be the teacher (partner) or a confirmed attendee (booking)
-- Posts are only visible after the session has ended

create table if not exists public.session_posts (
  id            uuid primary key default gen_random_uuid(),
  session_id    uuid not null references public.sessions(id) on delete cascade,
  author_type   text not null check (author_type in ('teacher', 'attendee')),
  -- teacher: partner_id of the instructor
  partner_id    uuid references public.partners(id) on delete set null,
  -- attendee: booking_id of the confirmed attendee
  booking_id    uuid references public.bookings(id) on delete set null,
  author_name   text not null,
  content       text not null check (trim(content) <> ''),
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  constraint session_posts_author_check check (
    (author_type = 'teacher' and partner_id is not null and booking_id is null)
    or
    (author_type = 'attendee' and booking_id is not null and partner_id is null)
  )
);

create index if not exists session_posts_session_idx
  on public.session_posts (session_id, created_at);

create trigger session_posts_updated_at
  before update on public.session_posts
  for each row execute function public.set_updated_at();

alter table public.session_posts enable row level security;

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------

-- Public: no access (posts are private to session participants)

-- Teacher: read all posts on own sessions, write as teacher
create policy "teacher read session posts"
  on public.session_posts for select
  to authenticated
  using (
    public.is_teacher_user()
    and exists (
      select 1 from public.sessions s
      where s.id = session_id
        and s.instructor_id = public.my_partner_id()
    )
  );

create policy "teacher write session posts"
  on public.session_posts for insert
  to authenticated
  with check (
    public.is_teacher_user()
    and author_type = 'teacher'
    and partner_id = public.my_partner_id()
    and exists (
      select 1 from public.sessions s
      where s.id = session_id
        and s.instructor_id = public.my_partner_id()
        and s.ends_at < now()   -- 수업 종료 후에만
    )
  );

create policy "teacher delete own session posts"
  on public.session_posts for delete
  to authenticated
  using (
    public.is_teacher_user()
    and author_type = 'teacher'
    and partner_id = public.my_partner_id()
  );

-- Admin: full access
create policy "admin all on session posts"
  on public.session_posts for all
  to authenticated
  using (public.is_admin_user())
  with check (public.is_admin_user());
