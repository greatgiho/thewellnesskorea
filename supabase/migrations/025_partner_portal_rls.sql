-- Partner portal RLS: teacher role can read own sessions and their bookings
-- A "teacher" is an auth user with app_metadata.role = 'teacher'
-- linked to a partners row via partners.user_id = auth.uid()

-- ---------------------------------------------------------------------------
-- Helper function
-- ---------------------------------------------------------------------------

create or replace function public.is_teacher_user()
returns boolean
language sql
stable
as $$
  select coalesce(
    (auth.jwt() -> 'app_metadata' ->> 'role') = 'teacher',
    false
  );
$$;

-- Returns the partner id linked to the current auth user (teacher only)
create or replace function public.my_partner_id()
returns uuid
language sql
stable
as $$
  select id from public.partners
  where user_id = auth.uid()
  limit 1;
$$;

-- ---------------------------------------------------------------------------
-- sessions: teacher can read own sessions
-- ---------------------------------------------------------------------------

drop policy if exists "teacher read own sessions" on public.sessions;

create policy "teacher read own sessions"
  on public.sessions for select
  to authenticated
  using (
    public.is_teacher_user()
    and instructor_id = public.my_partner_id()
  );

-- ---------------------------------------------------------------------------
-- bookings: teacher can read bookings for own sessions
-- ---------------------------------------------------------------------------

drop policy if exists "teacher read own session bookings" on public.bookings;

create policy "teacher read own session bookings"
  on public.bookings for select
  to authenticated
  using (
    public.is_teacher_user()
    and exists (
      select 1 from public.sessions s
      where s.id = session_id
        and s.instructor_id = public.my_partner_id()
    )
  );

-- ---------------------------------------------------------------------------
-- partners: teacher can read own profile
-- ---------------------------------------------------------------------------

drop policy if exists "teacher read own partner profile" on public.partners;

create policy "teacher read own partner profile"
  on public.partners for select
  to authenticated
  using (
    public.is_teacher_user()
    and user_id = auth.uid()
  );
