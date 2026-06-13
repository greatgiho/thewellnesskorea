-- The Wellness Korea: Person master (Guide / Artist)
create type public.person_kind as enum ('guide', 'artist', 'both');

create table public.people (
  id            uuid primary key default gen_random_uuid(),
  slug          text not null unique,
  kind          public.person_kind not null,
  name_ko       text not null,
  name_en       text not null,
  role_ko       text not null,
  role_en       text not null,
  quote         text,
  modalities    text[] not null default '{}',
  photo_path    text,
  sort_order    int not null default 0,
  is_published  boolean not null default false,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index people_kind_published_idx
  on public.people (kind, is_published, sort_order);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger people_updated_at
  before update on public.people
  for each row execute function public.set_updated_at();

alter table public.people enable row level security;

create policy "public read published people"
  on public.people for select
  using (is_published = true);

create policy "admin all on people"
  on public.people for all
  to authenticated
  using (true)
  with check (true);

-- Storage bucket (run in SQL editor if bucket API differs)
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'person-photos',
  'person-photos',
  true,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do nothing;

create policy "public read person photos"
  on storage.objects for select
  using (bucket_id = 'person-photos');

create policy "admin upload person photos"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'person-photos');

create policy "admin update person photos"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'person-photos');

create policy "admin delete person photos"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'person-photos');
