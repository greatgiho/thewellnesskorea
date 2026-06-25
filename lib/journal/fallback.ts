import type { JournalPostRow } from "./types"
import { JOURNAL_SEED_POSTS } from "./seed-content"

/** Static posts when DB is empty or unavailable. */
export const FALLBACK_JOURNAL_POSTS: JournalPostRow[] = JOURNAL_SEED_POSTS.map(
  (post, index) => ({
    id: `fallback-${post.slug}`,
    ...post,
    focal_point: "50% 50%",
    is_published: true,
    experience_id: null,
    seo_title: null,
    seo_description: null,
    created_at: post.published_at,
    updated_at: post.published_at,
  }),
)
