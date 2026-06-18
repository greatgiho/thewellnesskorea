-- Activity regions: nationwide master + per-person priority 1/2

create table if not exists public.regions (
  code        text primary key,
  parent_code text references public.regions(code) on delete restrict,
  level       smallint not null check (level between 1 and 3),
  name_ko     text not null,
  name_en     text not null,
  sort_order  int not null default 0
);

create index if not exists regions_parent_level_idx
  on public.regions (parent_code, level, sort_order);

create table if not exists public.person_activity_regions (
  person_id   uuid not null references public.people(id) on delete cascade,
  priority    smallint not null check (priority in (1, 2)),
  region_code text not null references public.regions(code) on delete restrict,
  created_at  timestamptz not null default now(),
  primary key (person_id, priority),
  constraint person_activity_regions_unique_region
    unique (person_id, region_code)
);

create index if not exists person_activity_regions_region_idx
  on public.person_activity_regions (region_code);

alter table public.regions enable row level security;
alter table public.person_activity_regions enable row level security;

create policy "public read regions"
  on public.regions for select
  using (true);

create policy "admin all on regions"
  on public.regions for all
  to authenticated
  using (public.is_admin_user())
  with check (public.is_admin_user());

create policy "public read activity regions of published people"
  on public.person_activity_regions for select
  using (
    exists (
      select 1 from public.people p
      where p.id = person_id
        and p.is_published = true
        and p.registration_status in ('admin', 'approved')
    )
  );

create policy "admin all on person_activity_regions"
  on public.person_activity_regions for all
  to authenticated
  using (public.is_admin_user())
  with check (public.is_admin_user());

create policy "teacher read own activity regions"
  on public.person_activity_regions for select
  to authenticated
  using (
    exists (
      select 1 from public.people p
      where p.id = person_id and p.user_id = auth.uid()
    )
  );

create policy "teacher manage own activity regions"
  on public.person_activity_regions for all
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
