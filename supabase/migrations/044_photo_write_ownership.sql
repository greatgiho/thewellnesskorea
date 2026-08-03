-- Who may write a photo: an admin, or its owner.
--
-- person-photos and session-photos accepted any authenticated user. Since the
-- path is `{ownerId}/{file}` and uploads upsert, that let anyone signed in
-- overwrite anyone else's profile picture given only their partner id — which
-- the public partner pages hand out. Journal photos were already admin-only;
-- these two were not, and nothing in the app relied on the difference.
--
-- The rule per bucket follows who the thing belongs to:
--
--   person-photos   admin, or the partner whose folder it is. A partner's
--                   photo is their own face on the public site, so they get
--                   to replace it. No UI for that yet — /p/profile only shows
--                   it — but the rule is the same either way, and writing it
--                   now means the feature does not need another migration.
--
--   session-photos  admin only. A class is not the instructor's to edit;
--                   sessions are created and changed by an admin.
--
-- Ownership is read from the caller's own partner row via my_partner_id(),
-- never from anything the client sends — the same shape as set_session_pricing
-- in 039.
--
-- UPDATE gets a with-check as well as a using clause, so a row cannot be
-- updated *into* someone else's folder.

-- ---------------------------------------------------------------------------
-- person-photos: admin, or the partner who owns the folder
-- ---------------------------------------------------------------------------

drop policy if exists "admin upload person photos" on storage.objects;
drop policy if exists "write own or admin person photos" on storage.objects;
create policy "write own or admin person photos"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'person-photos'
    and (
      public.is_admin_user()
      or (storage.foldername(name))[1] = public.my_partner_id()::text
    )
  );

drop policy if exists "admin update person photos" on storage.objects;
drop policy if exists "update own or admin person photos" on storage.objects;
create policy "update own or admin person photos"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'person-photos'
    and (
      public.is_admin_user()
      or (storage.foldername(name))[1] = public.my_partner_id()::text
    )
  )
  with check (
    bucket_id = 'person-photos'
    and (
      public.is_admin_user()
      or (storage.foldername(name))[1] = public.my_partner_id()::text
    )
  );

drop policy if exists "admin delete person photos" on storage.objects;
drop policy if exists "delete own or admin person photos" on storage.objects;
create policy "delete own or admin person photos"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'person-photos'
    and (
      public.is_admin_user()
      or (storage.foldername(name))[1] = public.my_partner_id()::text
    )
  );

-- ---------------------------------------------------------------------------
-- session-photos: admin only
-- ---------------------------------------------------------------------------

drop policy if exists "admin upload session photos" on storage.objects;
create policy "admin upload session photos"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'session-photos' and public.is_admin_user());

drop policy if exists "admin update session photos" on storage.objects;
create policy "admin update session photos"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'session-photos' and public.is_admin_user())
  with check (bucket_id = 'session-photos' and public.is_admin_user());

drop policy if exists "admin delete session photos" on storage.objects;
create policy "admin delete session photos"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'session-photos' and public.is_admin_user());
