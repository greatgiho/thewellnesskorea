-- Account model cleanup: common member profile (name/phone/locale) moves to
-- auth.users app_metadata. The public.members table is empty (0 rows) and has
-- no inbound foreign keys (bookings reference auth.users directly), so it can
-- be dropped safely. Member-specific extras, if ever needed, go in a future
-- member_aux table.

drop table if exists public.members cascade;
