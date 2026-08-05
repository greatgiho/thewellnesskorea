-- ============================================================================
-- Let a soft delete actually happen.
--
-- 046 gave community_posts a SELECT policy of `deleted_at IS NULL`, so the
-- moment a row set deleted_at it stopped satisfying its own read policy and
-- Postgres refused the UPDATE: "new row violates row-level security policy".
-- Deleting a post was impossible for everyone, author and admin alike. The
-- draft this came from had the same clause, so the bug predates the rewrite;
-- it survived because nothing had ever run the migration.
--
-- Confirmed by experiment rather than by reading: dropping only the
-- `deleted_at IS NULL` term let the same UPDATE through.
--
-- A deleted post stays hidden from other partners. It stays visible to its
-- author and to admins, which is what makes the write legal — and is the
-- honest behaviour anyway, since they are the two parties allowed to undo it.
-- Listing already filters `deleted_at IS NULL` in the query
-- (lib/actions/community-actions.ts), so nothing starts showing tombstones.
-- ============================================================================

DROP POLICY IF EXISTS "community read for partners and admins" ON community_posts;
CREATE POLICY "community read for partners and admins"
ON community_posts
FOR SELECT
TO authenticated
USING (
    (public.my_partner_id() IS NOT NULL OR public.is_admin_user())
    AND (
        deleted_at IS NULL
        OR author_id = public.my_partner_id()
        OR public.is_admin_user()
    )
);
