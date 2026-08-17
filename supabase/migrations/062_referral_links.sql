-- Where a referral link actually points.
--
-- 061 gave each partner one code and one link, to the home page. What a partner
-- is handed in practice is narrower than that: a QR for the counter of one café
-- advertising one Saturday class. Same partner, several links, and the useful
-- question about a printed QR months later is "which class was this one for".
--
-- Attribution does not change. The URL still carries only ?ref=<code>, and a
-- booking is still stamped with the code alone. Splitting takings per link
-- would mean a second identifier in the URL and a second thing to get wrong,
-- and it would answer the wrong question anyway: someone can scan the QR for
-- Saturday's class and book Sunday's, and the money is Sunday's. Reporting
-- groups by the session that was actually booked, which is the number a
-- statement is written from.

create table if not exists public.referral_links (
  id          uuid primary key default gen_random_uuid(),
  referrer_id uuid not null references public.referrers(id) on delete cascade,

  -- What the link points at. Null means the site's front page.
  --
  -- on delete set null rather than cascade: deleting a class must not quietly
  -- delete the record of a QR that is still stuck to a wall somewhere.
  session_id  uuid references public.sessions(id) on delete set null,

  -- The path as it was when the QR was made, kept alongside session_id rather
  -- than derived from it. Once the QR is printed the path is a fact about the
  -- physical world; if the session row later goes away, this still says where
  -- the thing on the wall sends people.
  path        text not null default '/',

  -- What to call it on the shelf. "통의동 카페 카운터", not the URL.
  label       text not null default '',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),

  -- Site-internal paths only. Every path here is built by us from a picked
  -- session, never typed, and this keeps it that way if that ever slips.
  constraint referral_links_path_format check (path ~ '^/[A-Za-z0-9/_-]*$')
);

-- One link per target per partner: making the same QR twice is a mistake, not
-- an intention, and two rows for it means two answers to "what did we give the
-- café".
create unique index if not exists referral_links_referrer_path_key
  on public.referral_links (referrer_id, path);

create index if not exists referral_links_session_idx
  on public.referral_links (session_id)
  where session_id is not null;

drop trigger if exists referral_links_updated_at on public.referral_links;
create trigger referral_links_updated_at
  before update on public.referral_links
  for each row execute function public.set_updated_at();

alter table public.referral_links enable row level security;

-- No public policy, unlike referrers. A visitor arriving on a referral link
-- carries everything needed in the URL; nothing at request time reads this
-- table, so nothing outside the admin has a reason to see the list of what has
-- been printed and where.
drop policy if exists "admin all on referral links" on public.referral_links;
create policy "admin all on referral links"
  on public.referral_links for all
  to authenticated
  using (public.is_admin_user())
  with check (public.is_admin_user());

-- Read-only collaborators see the list, same as they see the schedule. Select
-- only, and there is deliberately no viewer write policy anywhere (035).
drop policy if exists "viewer read referral links" on public.referral_links;
create policy "viewer read referral links"
  on public.referral_links for select
  to authenticated
  using (public.is_viewer_user());

-- referrers already allows any signed-in reader to select active rows (061).
-- Viewers need the inactive ones too, or a retired partner's links appear in
-- /v attached to nothing.
drop policy if exists "viewer read referrers" on public.referrers;
create policy "viewer read referrers"
  on public.referrers for select
  to authenticated
  using (public.is_viewer_user());

comment on table public.referral_links is
  'Saved referral link targets, one row per printed QR. Management record only — attribution runs on referrers.code, so deleting a row here loses no takings.';
