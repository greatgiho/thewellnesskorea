-- 024_journal_focal_point.sql
-- Add focal_point to journal_posts.
-- CSS object-position string, e.g. '50% 50%' (center) or '30% 20%' (upper-left area).

alter table journal_posts
  add column if not exists focal_point text not null default '50% 50%';

-- Backfill any rows that may have been inserted without the default (safety net).
update journal_posts
  set focal_point = '50% 50%'
  where focal_point is null or focal_point = '';
