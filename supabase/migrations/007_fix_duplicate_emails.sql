-- Complete teacher self-registration migration (safe to re-run).
-- Use this instead of 006 if 006 failed partway (transaction rolled back).

-- 1) Enum
do $$ begin
  create type public.person_registration_status as enum (
    'admin',
    'draft',
    'submitted',
    'approved',
    'rejected'
  );
exception
  when duplicate_object then null;
end $$;

-- 2) Columns (must exist before dedupe / policies)
alter table public.people
  add column if not exists user_id uuid
    references auth.users(id) on delete set null,
  add column if not exists registration_status public.person_registration_status
    not null default 'admin',
  add column if not exists submitted_at timestamptz,
  add column if not exists reviewed_at timestamptz,
  add column if not exists reviewed_by uuid references auth.users(id),
  add column if not exists rejection_reason text;

create unique index if not exists people_user_id_unique_idx
  on public.people (user_id)
  where user_id is not null;

create index if not exists people_registration_status_idx
  on public.people (registration_status, updated_at desc);

-- 3) Dedupe emails before unique index
with ranked as (
  select
    id,
    row_number() over (
      partition by lower(trim(email))
      order by
        is_published desc,
        updated_at desc,
        created_at asc
    ) as rn
  from public.people
  where email is not null and trim(email) <> ''
)
update public.people p
set email = null
from ranked r
where p.id = r.id and r.rn > 1;

-- 4) Unique email (teacher account linking)
create unique index if not exists people_email_unique_idx
  on public.people (lower(email))
  where email is not null and trim(email) <> '';

-- 5) Backfill status on legacy rows
update public.people
set registration_status = case
  when is_published then 'approved'::public.person_registration_status
  else 'admin'::public.person_registration_status
end
where user_id is null;

-- 6) RLS helpers + policies
create or replace function public.is_admin_user()
returns boolean
language sql
stable
as $$
  select coalesce(
    (auth.jwt() -> 'app_metadata' ->> 'role') is distinct from 'teacher',
    true
  );
$$;

drop policy if exists "public read published people" on public.people;

create policy "public read published people"
  on public.people for select
  using (
    is_published = true
    and registration_status in ('admin', 'approved')
  );

drop policy if exists "admin all on people" on public.people;

create policy "admin all on people"
  on public.people for all
  to authenticated
  using (public.is_admin_user())
  with check (public.is_admin_user());

drop policy if exists "teacher read own people" on public.people;
create policy "teacher read own people"
  on public.people for select
  to authenticated
  using (user_id = auth.uid());

drop policy if exists "teacher insert own people" on public.people;
create policy "teacher insert own people"
  on public.people for insert
  to authenticated
  with check (
    user_id = auth.uid()
    and registration_status in ('draft', 'submitted')
    and is_published = false
    and not exists (
      select 1 from public.people p where p.user_id = auth.uid()
    )
  );

drop policy if exists "teacher update own people" on public.people;
create policy "teacher update own people"
  on public.people for update
  to authenticated
  using (user_id = auth.uid())
  with check (
    user_id = auth.uid()
    and is_published = false
  );

drop policy if exists "public read programs of published people" on public.person_programs;

create policy "public read programs of published people"
  on public.person_programs for select
  using (
    exists (
      select 1 from public.people p
      where p.id = person_id
        and p.is_published = true
        and p.registration_status in ('admin', 'approved')
    )
  );

drop policy if exists "admin all on person_programs" on public.person_programs;

create policy "admin all on person_programs"
  on public.person_programs for all
  to authenticated
  using (public.is_admin_user())
  with check (public.is_admin_user());

drop policy if exists "teacher manage own programs" on public.person_programs;
create policy "teacher manage own programs"
  on public.person_programs for all
  to authenticated
  using (
    exists (
      select 1 from public.people p
      where p.id = person_id and p.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.people p
      where p.id = person_id and p.user_id = auth.uid()
    )
  );
