-- Partner kind (Brand) + journal ↔ people tag links

alter type public.person_kind add value if not exists 'brand';

create table if not exists public.journal_post_people (
  id              uuid primary key default gen_random_uuid(),
  journal_post_id uuid not null references public.journal_posts(id) on delete cascade,
  person_id       uuid not null references public.people(id) on delete cascade,
  sort_order      int not null default 0,
  created_at      timestamptz not null default now(),
  unique (journal_post_id, person_id)
);

create index if not exists journal_post_people_post_idx
  on public.journal_post_people (journal_post_id, sort_order);

alter table public.journal_post_people enable row level security;

create policy "public read journal post partners"
  on public.journal_post_people for select
  using (
    exists (
      select 1 from public.journal_posts jp
      where jp.id = journal_post_id and jp.is_published = true
    )
    and exists (
      select 1 from public.people p
      where p.id = person_id
        and p.is_published = true
        and p.registration_status in ('admin', 'approved')
    )
  );

create policy "admin all on journal post people"
  on public.journal_post_people for all
  to authenticated
  using (public.is_admin_user())
  with check (public.is_admin_user());
