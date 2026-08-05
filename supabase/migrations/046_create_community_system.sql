-- ============================================================================
-- Partner community posts.
--
-- Renumbered from 036: 036 and 037 were already taken (036_payment_amount_
-- alignment, 037_session_discount) and already recorded in the ledger, so a
-- migration numbered 036 would never have been picked up. Nothing had applied
-- this file in any environment, which is why community_posts did not exist
-- anywhere even though the feature was deployed.
--
-- The policies below differ from the original draft. `registration_status` is
-- not an authorisation field: 'admin' there means "created by an admin", and
-- every partner in production that can log in carries that value. Testing it
-- would have handed every partner edit and delete rights over every post.
-- Authorisation goes through is_admin_user() (app_metadata.role) and
-- my_partner_id(), the helpers the rest of the schema already uses.
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS community_posts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    author_id UUID NOT NULL REFERENCES partners(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    post_type TEXT NOT NULL DEFAULT 'general', -- 'announcement', 'general', etc.
    is_published BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    deleted_at TIMESTAMPTZ DEFAULT NULL
);

CREATE INDEX IF NOT EXISTS idx_community_posts_author_id ON community_posts(author_id);
CREATE INDEX IF NOT EXISTS idx_community_posts_deleted_at ON community_posts(deleted_at);

-- Otherwise updated_at only ever holds the insert time, unlike every other
-- table here.
DROP TRIGGER IF EXISTS community_posts_updated_at ON community_posts;
CREATE TRIGGER community_posts_updated_at
  BEFORE UPDATE ON community_posts
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE community_posts ENABLE ROW LEVEL SECURITY;

-- Read: partners and admins. `TO authenticated` on its own would have included
-- members, who hold accounts on the same project and have no business here.
DROP POLICY IF EXISTS "Enable read access for authenticated partners" ON community_posts;
DROP POLICY IF EXISTS "community read for partners and admins" ON community_posts;
CREATE POLICY "community read for partners and admins"
ON community_posts
FOR SELECT
TO authenticated
USING (
    deleted_at IS NULL
    AND (public.my_partner_id() IS NOT NULL OR public.is_admin_user())
);

-- Insert: as yourself only. WITH CHECK (true) let any authenticated caller
-- write a row naming someone else as the author.
DROP POLICY IF EXISTS "Enable insert access for authenticated partners" ON community_posts;
DROP POLICY IF EXISTS "community insert own posts" ON community_posts;
CREATE POLICY "community insert own posts"
ON community_posts
FOR INSERT
TO authenticated
WITH CHECK (author_id = public.my_partner_id());

-- Update covers the soft delete too, since deleted_at is a column rather than
-- a DELETE. The draft had a second, identical FOR UPDATE policy for that;
-- policies are OR'd, so it only added a copy that was missing a WITH CHECK.
DROP POLICY IF EXISTS "Enable update access for authors and admins" ON community_posts;
DROP POLICY IF EXISTS "Enable delete access for authors and admins" ON community_posts;
DROP POLICY IF EXISTS "community update by author or admin" ON community_posts;
CREATE POLICY "community update by author or admin"
ON community_posts
FOR UPDATE
TO authenticated
USING (author_id = public.my_partner_id() OR public.is_admin_user())
WITH CHECK (author_id = public.my_partner_id() OR public.is_admin_user());
