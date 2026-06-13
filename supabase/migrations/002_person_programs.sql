-- Contact fields + program-level philosophy paths

create type public.path_key as enum (
  'bium',
  'kkaeum',
  'jieum',
  'chaeum',
  'nurim'
);

alter table public.people
  add column if not exists phone text,
  add column if not exists email text,
  add column if not exists instagram text;

create table if not exists public.person_programs (
  id          uuid primary key default gen_random_uuid(),
  person_id   uuid not null references public.people(id) on delete cascade,
  title       text not null,
  description text,
  path_keys   public.path_key[] not null default '{}',
  sort_order  int not null default 0,
  created_at  timestamptz not null default now()
);

create index if not exists person_programs_person_idx
  on public.person_programs (person_id, sort_order);

alter table public.person_programs enable row level security;

create policy "public read programs of published people"
  on public.person_programs for select
  using (
    exists (
      select 1 from public.people p
      where p.id = person_id and p.is_published = true
    )
  );

create policy "admin all on person_programs"
  on public.person_programs for all
  to authenticated
  using (true)
  with check (true);

-- Optional: migrate legacy modalities into programs (no path_keys)
insert into public.person_programs (person_id, title, sort_order)
select p.id, m.title, m.ord - 1
from public.people p
cross join lateral unnest(p.modalities) with ordinality as m(title, ord)
where cardinality(p.modalities) > 0
  and not exists (
    select 1 from public.person_programs pp where pp.person_id = p.id
  );
