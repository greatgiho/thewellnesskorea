-- Columns for the v0 redesign's Brickwell / PastEvents / Programs sections.
--
-- Decision: reuse experiences + sessions instead of new tables. No admin UI
-- yet — content for these three sections will be entered directly in the DB
-- until an admin screen is scoped separately.
--
-- experiences: name_ko already exists but headline/description are
-- English-only. Add the ko counterparts so experience copy can be bilingual
-- (the redesign is fully en/ko toggle-driven, unlike the old homepage).
alter table public.experiences
  add column if not exists headline_ko text,
  add column if not exists description_ko text;

-- sessions: gives Brickwell/PastEvents/Programs what they need without a new
-- table.
--   - title_ko: session.title has no Korean counterpart today. Bilingual
--     toggling is a core feature of the redesign (unlike the old homepage,
--     which was English-only), so this isn't a "later" column — added now
--     alongside the other content fields instead of leaving titles stuck in
--     English when the language toggle is set to Korean. Nullable: falls
--     back to `title` until backfilled.
--   - content_category: explicit day/night/exhibition tag for Brickwell's
--     three panels. Independent of path_keys (bium/kkaeum/... is a different
--     taxonomy) and not inferred from starts_at, since an "exhibition" item
--     isn't a scheduled class at all.
--   - blurb_en/ko: short card-teaser copy, separate from the existing
--     description_blocks (intro/progress/preparation), which is written for
--     the real booking-detail page, not a marketing card.
--   - location_label_en/ko: free-form place text (e.g. "Seochon & Brickwell"
--     spanning more than one floor), since floor_id points at exactly one
--     floor and is_all_floors is boolean-only.
--   - is_bookable: exhibition items are content, not classes — they still
--     need a valid capacity (`capacity > 0` is a hard check) and price, but
--     is_bookable = false tells the app to render them without a
--     book/waitlist link. Defaults true so every existing row is unaffected.
alter table public.sessions
  add column if not exists title_ko text,
  add column if not exists content_category text,
  add column if not exists blurb_en text,
  add column if not exists blurb_ko text,
  add column if not exists location_label_en text,
  add column if not exists location_label_ko text,
  add column if not exists is_bookable boolean not null default true;

alter table public.sessions
  add constraint sessions_content_category_check
  check (content_category is null or content_category in ('day', 'night', 'exhibition'));
