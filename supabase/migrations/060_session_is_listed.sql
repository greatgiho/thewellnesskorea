-- Separate "anyone can find this" from "anyone can book this".
--
-- is_published has been doing both jobs: it puts a class on the homepage and
-- it is what create_booking_hold checks before it will hold a seat. So there
-- was no way to run a class that is bookable by link but not advertised —
-- a private session for one group, or a paid test against the live processor
-- that should not appear on the public list while it happens.
--
-- The split goes this way round on purpose. is_published keeps its meaning of
-- "bookable", so the two booking functions are not touched: they are large
-- plpgsql that has been rebuilt five times across 038, 040, 053, 054 and 055,
-- and rebuilding one of them from the wrong base is exactly how every
-- non-coupon booking broke earlier in this project. A listing flag can be
-- added without opening them at all.
--
--   is_published  is_listed
--       true        true     public — on the list, bookable  (every row today)
--       true        false    unlisted — bookable by link only
--       false        —       draft — neither
--
-- Defaults to true, so nothing that exists changes.

alter table public.sessions
  add column if not exists is_listed boolean not null default true;

comment on column public.sessions.is_listed is
  'false = bookable by direct link but kept off the public lists. See 060.';
