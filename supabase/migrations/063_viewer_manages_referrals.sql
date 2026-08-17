-- Let read-only collaborators manage referrals.
--
-- This is the first write policy the viewer role has ever had. 035 says, in
-- as many words, that there deliberately is none: viewers exist so someone can
-- be given the schedule without being given the admin. Breaking that rule is
-- worth writing down rather than discovering later.
--
-- The reason is that the person actually doing this work — deciding who posts
-- which class, handing out the QR, chasing the partner — holds a viewer
-- account. Making them ask an admin to add a row would mean the admin password
-- gets shared, which is a worse outcome than this policy.
--
-- Scoped to these two tables and nothing else. Bookings, payments, sessions
-- and members stay read-only for viewers; a referral row is a note about who
-- to pay, and the worst a wrong one does is send a QR to the wrong place.
-- Attribution itself lives on bookings.referral_code, which viewers still
-- cannot write.

-- `for all` rather than separate insert/update/delete, matching the admin
-- policy on the same table so the two roles cannot quietly drift apart. The UI
-- still never deletes a referrer — bookings keep the code as text, so a
-- deleted row would leave a past statement pointing at a name nobody can look
-- up (061). That restraint belongs in the screen, not here: the policy answers
-- "may this role touch this table", not "is this a good idea".
drop policy if exists "viewer read referrers" on public.referrers;
drop policy if exists "viewer manage referrers" on public.referrers;
create policy "viewer manage referrers"
  on public.referrers for all
  to authenticated
  using (public.is_viewer_user())
  with check (public.is_viewer_user());

drop policy if exists "viewer read referral links" on public.referral_links;
drop policy if exists "viewer manage referral links" on public.referral_links;
create policy "viewer manage referral links"
  on public.referral_links for all
  to authenticated
  using (public.is_viewer_user())
  with check (public.is_viewer_user());

comment on function public.is_viewer_user() is
  'True for read-only collaborator accounts (app_metadata.role = viewer). SELECT on schedule data, plus full management of referrers and referral_links (063) — the one place a viewer writes.';
