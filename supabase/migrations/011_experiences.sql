-- Experiences (Space / Journey) + attach floors & sessions

create type public.experience_kind as enum ('space', 'journey');

create table if not exists public.experiences (
  id                      uuid primary key default gen_random_uuid(),
  slug                    text not null unique,
  kind                    public.experience_kind not null,
  name_en                 text not null,
  name_ko                 text,
  hero_image_path         text,
  headline_en             text,
  description_en          text,
  secondary_link_label_en text,
  secondary_link_href     text,
  sort_order              int not null default 0,
  is_published            boolean not null default false,
  schedule_enabled        boolean not null default false,
  created_at              timestamptz not null default now(),
  updated_at              timestamptz not null default now()
);

create index if not exists experiences_kind_sort_idx
  on public.experiences (kind, sort_order);

create trigger experiences_updated_at
  before update on public.experiences
  for each row execute function public.set_updated_at();

insert into public.experiences (
  slug,
  kind,
  name_en,
  name_ko,
  hero_image_path,
  headline_en,
  description_en,
  secondary_link_label_en,
  secondary_link_href,
  sort_order,
  is_published,
  schedule_enabled
)
values
  (
    'brickwell',
    'space',
    'Brickwell',
    '브릭웰',
    '/kw-hero.png',
    'Live the time given to you, more fully.',
    'The Wellness Korea is not a cure or a single moment of healing. It is a way of restoring calm, rhythm, and clarity to the way you live each day.',
    'Visit our Space in Seochon, Brickwell',
    '#footer',
    0,
    true,
    true
  ),
  (
    'next-space',
    'space',
    'Next Space',
    null,
    null,
    'A new chapter is taking shape.',
    'The Wellness Korea continues to grow across spaces and journeys. Our next Space will be announced soon.',
    null,
    null,
    1,
    true,
    false
  )
on conflict (slug) do nothing;

-- Floors belong to an experience (each space can have its own floor set)

alter table public.floors
  add column if not exists experience_id uuid references public.experiences(id) on delete restrict;

update public.floors f
set experience_id = e.id
from public.experiences e
where e.slug = 'brickwell'
  and f.experience_id is null;

alter table public.floors
  alter column experience_id set not null;

alter table public.floors drop constraint if exists floors_level_key;
alter table public.floors drop constraint if exists floors_slug_key;
alter table public.floors drop constraint if exists floors_level_check;

alter table public.floors
  add constraint floors_experience_slug_unique unique (experience_id, slug);

alter table public.floors
  add constraint floors_experience_level_unique unique (experience_id, level);

alter table public.floors
  add constraint floors_level_check check (level between 1 and 99);

create index if not exists floors_experience_sort_idx
  on public.floors (experience_id, sort_order);

-- Sessions denormalize experience for filtering (must match floor's experience)

alter table public.sessions
  add column if not exists experience_id uuid references public.experiences(id) on delete restrict;

update public.sessions s
set experience_id = f.experience_id
from public.floors f
where s.floor_id = f.id
  and s.experience_id is null;

alter table public.sessions
  alter column experience_id set not null;

create index if not exists sessions_experience_starts_idx
  on public.sessions (experience_id, starts_at);

-- RLS

alter table public.experiences enable row level security;

create policy "public read published experiences"
  on public.experiences for select
  using (is_published = true);

create policy "admin all on experiences"
  on public.experiences for all
  to authenticated
  using (public.is_admin_user())
  with check (public.is_admin_user());
