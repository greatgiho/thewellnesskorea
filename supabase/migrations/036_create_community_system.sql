-- ============================================================================
-- Community System Unified Migration
-- 1. Enable pgcrypto extension for gen_random_uuid()
-- 2. Create community_posts table with soft delete (deleted_at)
-- 3. Setup Row Level Security (RLS) policies
-- ============================================================================

-- 1. Enable pgcrypto extension
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. Create community_posts table
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

-- Index for efficient querying of active posts and author lookup
CREATE INDEX IF NOT EXISTS idx_community_posts_author_id ON community_posts(author_id);
CREATE INDEX IF NOT EXISTS idx_community_posts_deleted_at ON community_posts(deleted_at);

-- 3. Enable Row Level Security (RLS)
ALTER TABLE community_posts ENABLE ROW LEVEL SECURITY;

-- Policy: Select - Authenticated partners can view active (non-deleted) posts
CREATE POLICY "Enable read access for authenticated partners"
ON community_posts
FOR SELECT
TO authenticated
USING (deleted_at IS NULL);

-- Policy: Insert - Authenticated partners can create posts
CREATE POLICY "Enable insert access for authenticated partners"
ON community_posts
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Policy: Update - Authors can update their own posts, or admins can update any post
CREATE POLICY "Enable update access for authors and admins"
ON community_posts
FOR UPDATE
TO authenticated
USING (
    author_id IN (
        SELECT id FROM partners WHERE user_id = auth.uid()
    )
    OR
    EXISTS (
        SELECT 1 FROM partners
        WHERE user_id = auth.uid()
        AND registration_status = 'admin'
    )
)
WITH CHECK (
    author_id IN (
        SELECT id FROM partners WHERE user_id = auth.uid()
    )
    OR
    EXISTS (
        SELECT 1 FROM partners
        WHERE user_id = auth.uid()
        AND registration_status = 'admin'
    )
);

-- Policy: Delete (Soft Delete) - Authors or admins can update deleted_at
CREATE POLICY "Enable delete access for authors and admins"
ON community_posts
FOR UPDATE
TO authenticated
USING (
    author_id IN (
        SELECT id FROM partners WHERE user_id = auth.uid()
    )
    OR
    EXISTS (
        SELECT 1 FROM partners
        WHERE user_id = auth.uid()
        AND registration_status = 'admin'
    )
);
