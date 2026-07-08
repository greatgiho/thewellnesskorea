-- Fix partner/member portal data access.
--
-- 1) Restore the standard Supabase role grants on schema public.
--    The numbered-migration lineage (local/ztail) never applied the default table
--    grants that a hosted Supabase project sets up, so authenticated/anon/
--    service_role had NO table privileges. RLS-gated reads then failed with
--    "permission denied for table ..." (SQLSTATE 42501) *before* RLS was even
--    evaluated — e.g. a partner reading their own profile returned nothing, so
--    requirePartnerSession redirected to ?error=no_profile.
--    Prod's squashed baseline already has these grants, so this is a no-op there.
--    RLS still governs row-level access; per-function EXECUTE grants are left as
--    explicitly set (NOT broadened here) so SECURITY DEFINER admin RPCs stay locked
--    to service_role.
grant usage on schema public to anon, authenticated, service_role;
grant all on all tables in schema public to anon, authenticated, service_role;
grant all on all sequences in schema public to anon, authenticated, service_role;

alter default privileges in schema public
  grant all on tables to anon, authenticated, service_role;
alter default privileges in schema public
  grant all on sequences to anon, authenticated, service_role;

-- 2) The teacher->partner role rename (028) left this RLS helper checking the old
--    'teacher' role, so partner-role users failed every is_teacher_user()-gated
--    policy (own sessions / bookings / session_posts). Check the current role.
create or replace function public.is_teacher_user()
returns boolean
language sql
stable
as $$
  select (auth.jwt() -> 'app_metadata' ->> 'role') = 'partner';
$$;
