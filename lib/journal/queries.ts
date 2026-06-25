import { createClient } from "@/lib/supabase/server"
import { getJournalPhotoUrl } from "./images"
import type { JournalCardData, JournalCategory, JournalPostRow } from "./types"
import { JOURNAL_PUBLIC_COLUMNS } from "./types"
import { FALLBACK_JOURNAL_POSTS } from "./fallback"

function toCard(row: JournalPostRow): JournalCardData {
  return {
    slug: row.slug,
    title: row.title_en,
    excerpt: row.excerpt_en,
    heroImage: row.hero_image_path
      ? getJournalPhotoUrl(row.hero_image_path)
      : null,
    focalPoint: row.focal_point || "50% 50%",
    category: row.category,
    publishedAt: row.published_at,
    readMinutes: row.read_minutes,
  }
}

export async function getPublishedJournalPosts(): Promise<JournalCardData[]> {
  if (
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  ) {
    return FALLBACK_JOURNAL_POSTS.filter((p) => p.is_published).map(toCard)
  }

  const supabase = await createClient()
  const { data, error } = await supabase
    .from("journal_posts")
    .select(JOURNAL_PUBLIC_COLUMNS)
    .eq("is_published", true)
    .order("published_at", { ascending: false })

  if (error || !data?.length) {
    return FALLBACK_JOURNAL_POSTS.filter((p) => p.is_published).map(toCard)
  }

  return (data as JournalPostRow[]).map(toCard)
}

export async function getPublishedJournalPostBySlug(
  slug: string,
): Promise<JournalPostRow | null> {
  if (
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  ) {
    const fallback = FALLBACK_JOURNAL_POSTS.find(
      (p) => p.slug === slug && p.is_published,
    )
    return fallback ?? null
  }

  const supabase = await createClient()
  const { data, error } = await supabase
    .from("journal_posts")
    .select(JOURNAL_PUBLIC_COLUMNS)
    .eq("slug", slug)
    .eq("is_published", true)
    .maybeSingle()

  if (error || !data) {
    const fallback = FALLBACK_JOURNAL_POSTS.find(
      (p) => p.slug === slug && p.is_published,
    )
    return fallback ?? null
  }

  return data as JournalPostRow
}

export async function getPublishedJournalPostsByCategory(
  category: JournalCategory | "all",
): Promise<JournalCardData[]> {
  const all = await getPublishedJournalPosts()
  if (category === "all") return all
  return all.filter((post) => post.category === category)
}
