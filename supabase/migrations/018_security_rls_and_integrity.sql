-- S1: is_admin_user() — require explicit app_metadata.role = 'admin'
-- S2: floors write — admin only (was any authenticated user)
-- Integrity: session.experience_id must match floor.experience_id
-- Index: journal_post_people.person_id for reverse partner lookup
--
-- Before deploy: ensure every admin Auth user has app_metadata.role = 'admin'
-- (npm run create-admin sets this; legacy accounts: Supabase Dashboard → Auth → user → app_metadata)

create or replace function public.is_admin_user()
returns boolean
language sql
stable
as $$
  select coalesce(
    (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin',
    false
  );
$$;

drop policy if exists "admin all on floors" on public.floors;

create policy "admin all on floors"
  on public.floors for all
  to authenticated
  using (public.is_admin_user())
  with check (public.is_admin_user());

create or replace function public.enforce_session_floor_experience_match()
returns trigger
language plpgsql
as $$
declare
  floor_experience_id uuid;
begin
  select f.experience_id into floor_experience_id
  from public.floors f
  where f.id = new.floor_id;

  if floor_experience_id is null then
    raise exception 'floor_id % not found', new.floor_id;
  end if;

  if new.experience_id is distinct from floor_experience_id then
    raise exception
      'session.experience_id must match floors.experience_id for floor_id %',
      new.floor_id;
  end if;

  return new;
end;
$$;

drop trigger if exists sessions_floor_experience_match on public.sessions;

create trigger sessions_floor_experience_match
  before insert or update of floor_id, experience_id
  on public.sessions
  for each row
  execute function public.enforce_session_floor_experience_match();

create index if not exists journal_post_people_person_idx
  on public.journal_post_people (person_id);
