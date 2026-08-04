-- Drop partners.modalities, the second copy of a partner's program titles.
--
-- partner_programs is what the app reads and writes; modalities was kept in
-- step by persistPartner mirroring the program titles into it on every save.
-- Two stores of the same fact is two chances to disagree, and the read path
-- carried a fallback that quietly substituted one for the other.
--
-- Verified duplicate before dropping. On both production and the dev clone,
-- every partner holding modalities also holds programs (21 of 21), and the
-- sorted arrays match title for title. No partner has modalities without
-- programs, so nothing here is the only copy of anything.
--
-- APPLY AFTER the code that stops writing this column is deployed. Reads use
-- select(*) and do not care, but persistPartner writes it by name until then,
-- and an insert naming a dropped column fails.

alter table public.partners
  drop column if exists modalities;
