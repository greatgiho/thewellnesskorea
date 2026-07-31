-- Read-only collaborator role.
--
-- Collaborators need the class schedule and how full the space is, but must
-- not see settlements or the member roster. Rather than loosening the admin
-- surface (16 pages / 12 server actions, where one missed check is a
-- privilege escalation), viewers get their own route (/v) and are refused by
-- everything else.
--
-- is_admin_user() is `role = 'admin'` exactly (fixed in 018), so a viewer is
-- already denied by every "admin all" policy. This migration therefore adds
-- SELECT and nothing else — there is deliberately no viewer write policy.
--
-- The public policies already cover published rows. What viewers need on top
-- is the unpublished/tentative side: a half-planned class still occupies the
-- room, so omitting it would misreport occupancy.

create or replace function public.is_viewer_user()
returns boolean
language sql
stable
as $$
  select coalesce(
    (auth.jwt() -> 'app_metadata' ->> 'role') = 'viewer',
    false
  );
$$;

comment on function public.is_viewer_user() is
  'True for read-only collaborator accounts (app_metadata.role = viewer). Grants SELECT on schedule data only; never used in a write policy.';

-- Schedule: every session regardless of is_published / status.
drop policy if exists "viewer read sessions" on public.sessions;
create policy "viewer read sessions"
  on public.sessions for select
  to authenticated
  using (public.is_viewer_user());

-- Instructor names shown on those sessions, including partners not yet
-- published — otherwise unpublished classes would render without a name.
drop policy if exists "viewer read partners" on public.partners;
create policy "viewer read partners"
  on public.partners for select
  to authenticated
  using (public.is_viewer_user());

-- Experience (venue) a session belongs to, same reasoning.
drop policy if exists "viewer read experiences" on public.experiences;
create policy "viewer read experiences"
  on public.experiences for select
  to authenticated
  using (public.is_viewer_user());

-- floors is already `using (true)`, so no viewer policy is needed there.
