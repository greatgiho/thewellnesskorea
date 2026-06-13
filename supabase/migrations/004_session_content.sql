-- Session booking content: images (max 3) + structured description blocks

alter table public.sessions
  add column if not exists image_paths text[] not null default '{}',
  add column if not exists description_blocks jsonb not null default '{
    "intro": "",
    "progress": "",
    "preparation": ""
  }'::jsonb;

alter table public.sessions
  drop constraint if exists sessions_image_paths_max_three;

alter table public.sessions
  add constraint sessions_image_paths_max_three
  check (cardinality(image_paths) <= 3);

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'session-photos',
  'session-photos',
  true,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do nothing;

create policy "public read session photos"
  on storage.objects for select
  using (bucket_id = 'session-photos');

create policy "admin upload session photos"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'session-photos');

create policy "admin update session photos"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'session-photos');

create policy "admin delete session photos"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'session-photos');
