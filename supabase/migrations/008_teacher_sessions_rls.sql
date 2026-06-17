-- Teacher portal: read own confirmed + published upcoming sessions

drop policy if exists "admin all on sessions" on public.sessions;

create policy "admin all on sessions"
  on public.sessions for all
  to authenticated
  using (public.is_admin_user())
  with check (public.is_admin_user());

create policy "teacher read own published sessions"
  on public.sessions for select
  to authenticated
  using (
    not public.is_admin_user()
    and status = 'confirmed'
    and is_published = true
    and instructor_id in (
      select id from public.people where user_id = auth.uid()
    )
  );
