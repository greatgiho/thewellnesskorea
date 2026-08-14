-- The rest of the footer: the copy the site says about itself.
--
-- 056 moved the legally required trader details out of the build. The block
-- directly above them — the tagline and the "Visit" address — was still
-- written in the component, which meant the same thing as before: operations
-- could not touch it, and dev could not say anything different from
-- production.
--
-- Named for where they appear rather than what they are (`visit_address_*`,
-- not `address`), because this table already has a business address and the
-- two are not the same thing: one is the registered address on the business
-- licence, the other is what a visitor needs to find the door.
--
-- Bilingual, because the footer is: the site has an en/ko toggle and this copy
-- is prose. The trader details in 056 are deliberately not — a registration
-- number has one official form.

alter table public.site_settings
  add column if not exists tagline_en       text not null default '',
  add column if not exists tagline_ko       text not null default '',
  -- One field per language, newline-separated, rendered a line per line. The
  -- alternative is a text[] and a repeater in the form; an address is short
  -- enough that a textarea says the same thing with nothing to maintain.
  add column if not exists visit_address_en text not null default '',
  add column if not exists visit_address_ko text not null default '',
  add column if not exists contact_email    text not null default '';

-- Seeded with what the component says today, unlike 056's empty seed. The
-- difference is what the value claims: a placeholder registration number would
-- be an invented fact about a real company, while this copy is already
-- published on the live site. Seeding it means this migration changes nothing
-- a visitor can see, and the component stops being the place it is edited.
--
-- Guarded on '' so re-running cannot overwrite what someone has since typed.
update public.site_settings set
  tagline_en = case when tagline_en = '' then
    'A calm place for Korean wellness in Seochon, Seoul. Soft, warm, and natural — come as you are.'
    else tagline_en end,
  tagline_ko = case when tagline_ko = '' then
    '서울 서촌에 자리한, 한국식 웰니스를 위한 고요한 공간. 부드럽고, 따뜻하고, 자연스럽게 — 있는 그대로 오세요.'
    else tagline_ko end,
  visit_address_en = case when visit_address_en = '' then
    E'Brickwell, Tongui-dong\nSeochon, Jongno-gu, Seoul'
    else visit_address_en end,
  visit_address_ko = case when visit_address_ko = '' then
    E'브릭웰, 통의동\n서촌, 종로구, 서울'
    else visit_address_ko end,
  contact_email = case when contact_email = '' then
    'hello@thewellnesskorea.com'
    else contact_email end
where id;
