-- Re-assert the storage policies, so a cloned project has them too.
--
-- Migrations 001, 004, and 014 create these, and both production and the local
-- stack carry all twelve. The dev clone carried none: it was made by copying
-- the production project, and that copy brought the buckets and their contents
-- but not the policies on storage.objects.
--
-- Row-level security stays enabled on that table, so a bucket with no policy
-- refuses every write. Reads kept working — the buckets are public, and a
-- public URL does not go through RLS — so the gap only showed as uploads
-- failing, on an admin whose session was perfectly valid.
--
-- Numbered migrations are the only thing every environment applies, so this
-- puts the policies back under that. Drop-then-create rather than
-- `if not exists`, so re-running also corrects a policy that has drifted.
--
-- Definitions are copied from 001/004/014 unchanged. They were verified
-- identical to production before this was written, including the asymmetry
-- below.
--
-- NOTE worth its own issue: journal photos require is_admin_user() to write,
-- while person and session photos accept any authenticated user. That is how
-- the original migrations wrote it, so it is preserved here rather than
-- quietly tightened — changing who may upload is not this migration's job.

-- person-photos (001)
drop policy if exists "public read person photos" on storage.objects;
create policy "public read person photos"
  on storage.objects for select
  using (bucket_id = 'person-photos');

drop policy if exists "admin upload person photos" on storage.objects;
create policy "admin upload person photos"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'person-photos');

drop policy if exists "admin update person photos" on storage.objects;
create policy "admin update person photos"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'person-photos');

drop policy if exists "admin delete person photos" on storage.objects;
create policy "admin delete person photos"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'person-photos');

-- session-photos (004)
drop policy if exists "public read session photos" on storage.objects;
create policy "public read session photos"
  on storage.objects for select
  using (bucket_id = 'session-photos');

drop policy if exists "admin upload session photos" on storage.objects;
create policy "admin upload session photos"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'session-photos');

drop policy if exists "admin update session photos" on storage.objects;
create policy "admin update session photos"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'session-photos');

drop policy if exists "admin delete session photos" on storage.objects;
create policy "admin delete session photos"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'session-photos');

-- journal-photos (014)
drop policy if exists "public read journal photos" on storage.objects;
create policy "public read journal photos"
  on storage.objects for select
  using (bucket_id = 'journal-photos');

drop policy if exists "admin upload journal photos" on storage.objects;
create policy "admin upload journal photos"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'journal-photos' and public.is_admin_user());

drop policy if exists "admin update journal photos" on storage.objects;
create policy "admin update journal photos"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'journal-photos' and public.is_admin_user());

drop policy if exists "admin delete journal photos" on storage.objects;
create policy "admin delete journal photos"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'journal-photos' and public.is_admin_user());
