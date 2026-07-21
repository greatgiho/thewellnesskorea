-- All-floor sessions: a session can occupy the whole building for its time range
-- (e.g. a building-wide retreat). floor_id stays as the "home" floor so the
-- existing FK and the session/floor experience-match trigger keep working;
-- is_all_floors marks the session as spanning every floor of its experience.

alter table public.sessions
  add column if not exists is_all_floors boolean not null default false;

-- Partial index to fetch all-floor sessions cheaply (they render on every floor).
create index if not exists sessions_all_floors_starts_idx
  on public.sessions (experience_id, starts_at)
  where is_all_floors;
