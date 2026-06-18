export type JournalCategory =
  | "philosophy"
  | "space"
  | "programs"
  | "news"

export type JournalPostRow = {
  id: string
  slug: string
  title_en: string
  title_ko: string | null
  excerpt_en: string
  body_en: string
  hero_image_path: string | null
  category: JournalCategory
  published_at: string
  read_minutes: number
  is_published: boolean
  experience_id: string | null
  seo_title: string | null
  seo_description: string | null
  created_at: string
  updated_at: string
}

export type JournalCardData = {
  slug: string
  title: string
  excerpt: string
  heroImage: string | null
  category: JournalCategory
  publishedAt: string
  readMinutes: number
}

export const JOURNAL_PUBLIC_COLUMNS =
  "id, slug, title_en, title_ko, excerpt_en, body_en, hero_image_path, category, published_at, read_minutes, is_published, experience_id, seo_title, seo_description, created_at, updated_at"
