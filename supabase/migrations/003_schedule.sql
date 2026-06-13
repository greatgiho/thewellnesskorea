-- Floors (1F–4F) and daily sessions

create table if not exists public.floors (
  id          uuid primary key default gen_random_uuid(),
  slug        text not null unique,
  level       smallint not null unique check (level between 1 and 4),
  name_ko     text not null,
  name_en     text not null,
  sort_order  int not null default 0
);

insert into public.floors (slug, level, name_ko, name_en, sort_order)
values
  ('1f', 1, '1층', '1F', 1),
  ('2f', 2, '2층', '2F', 2),
  ('3f', 3, '3층', '3F', 3),
  ('4f', 4, '4층', '4F', 4)
on conflict (slug) do nothing;

create table if not exists public.sessions (
  id                  uuid primary key default gen_random_uuid(),
  floor_id            uuid not null references public.floors(id) on delete restrict,
  instructor_id       uuid not null references public.people(id) on delete restrict,
  person_program_id   uuid references public.person_programs(id) on delete set null,
  title               text not null,
  path_keys           public.path_key[] not null default '{}',
  starts_at           timestamptz not null,
  ends_at             timestamptz not null,
  capacity            int not null check (capacity > 0),
  booked_count        int not null default 0 check (booked_count >= 0),
  is_published        boolean not null default false,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),
  constraint sessions_ends_after_start check (ends_at > starts_at)
);

create index if not exists sessions_floor_starts_idx
  on public.sessions (floor_id, starts_at);

create index if not exists sessions_instructor_starts_idx
  on public.sessions (instructor_id, starts_at);

create index if not exists sessions_starts_at_idx
  on public.sessions (starts_at);

create trigger sessions_updated_at
  before update on public.sessions
  for each row execute function public.set_updated_at();

alter table public.floors enable row level security;
alter table public.sessions enable row level security;

create policy "public read floors"
  on public.floors for select
  using (true);

create policy "admin all on floors"
  on public.floors for all
  to authenticated
  using (true)
  with check (true);

create policy "public read published sessions"
  on public.sessions for select
  using (is_published = true);

create policy "admin all on sessions"
  on public.sessions for all
  to authenticated
  using (true)
  with check (true);
