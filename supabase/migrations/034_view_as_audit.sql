-- view-as: admin-only read-only impersonation of a partner/member.
-- Audit trail of every impersonation entry.

create table if not exists public.view_as_audit (
  id uuid primary key default gen_random_uuid(),
  admin_user_id uuid not null references auth.users(id) on delete cascade,
  target_kind text not null check (target_kind in ('partner', 'member')),
  target_id text not null,
  started_at timestamptz not null default now()
);

alter table public.view_as_audit enable row level security;

-- Admins may read the audit trail. Inserts happen via the service role in the
-- start-view-as server action (after verifying the caller is an admin), which
-- bypasses RLS, so no insert policy is granted to normal roles.
create policy "view_as_audit admin read" on public.view_as_audit
  for select using (public.is_admin_user());

grant select on public.view_as_audit to authenticated;
