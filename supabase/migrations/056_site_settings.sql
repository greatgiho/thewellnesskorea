-- Business/representative details for the site footer.
--
-- Korea's e-commerce act requires a site that takes payment to display the
-- trading name, the representative's name, the business registration number,
-- the mail-order registration number, an address and a way to make contact.
-- So this is not decorative copy — it is a block that has to be right and has
-- to be there.
--
-- Why the database rather than an env var or a constant:
--
--   1. dev and production are already separate Supabase projects. Putting the
--      values here means "show something different on dev" needs no branch, no
--      VERCEL_ENV check and no second copy of every value.
--   2. A NEXT_PUBLIC_* variable is baked into the bundle at build time, and
--      Vercel binds env to a deployment — editing the value changes nothing
--      until a redeploy. A registration number correction should not need one.
--   3. Operations can fix a typo themselves, which is the whole point of the
--      admin screen this feeds.
--
-- One row, enforced by the primary key: `id boolean default true check (id)`
-- admits exactly one value, so a second row is a constraint violation rather
-- than a silent duplicate the app would have to pick between.
--
-- Seeded EMPTY on purpose. A placeholder registration number seeded here would
-- reach production as a real-looking claim about a real company; the footer
-- renders nothing until someone fills it in, which is the safer failure. dev's
-- dummy values get entered on dev, not written here.

create table if not exists public.site_settings (
  id                  boolean primary key default true check (id),
  -- Every field is `not null default ''` rather than nullable: the form always
  -- submits all of them, and "" already means "nothing to show". A nullable
  -- column would give the same state two spellings.
  business_name       text not null default '',
  representative_name text not null default '',
  business_number     text not null default '',
  mail_order_number   text not null default '',
  address             text not null default '',
  phone               text not null default '',
  email               text not null default '',
  privacy_officer     text not null default '',
  updated_at          timestamptz not null default now()
);

insert into public.site_settings (id) values (true)
on conflict (id) do nothing;

drop trigger if exists site_settings_updated_at on public.site_settings;
create trigger site_settings_updated_at
  before update on public.site_settings
  for each row execute function public.set_updated_at();

alter table public.site_settings enable row level security;

-- Read by everyone: it is printed on every public page.
drop policy if exists "public read site settings" on public.site_settings;
create policy "public read site settings"
  on public.site_settings for select
  to anon, authenticated
  using (true);

-- Update only. No insert, no delete: the row is created here and must keep
-- existing, so the only legitimate write is changing what it says.
drop policy if exists "admin update site settings" on public.site_settings;
create policy "admin update site settings"
  on public.site_settings for update
  to authenticated
  using (public.is_admin_user())
  with check (public.is_admin_user());

comment on table public.site_settings is
  'Single row. Business/representative details shown in the public footer.';
