-- Backfill: confirmed sessions should be visible on the public schedule.
-- Safe to re-run (only touches unpublished confirmed rows).

update public.sessions
set is_published = true
where status = 'confirmed'
  and is_published = false;
