export type JournalCategory =
  | "philosophy"
  | "space"
  | "programs"
  | "news"
  | "region"
  | "taste"

export type JournalPostRow = {
  id: string
  slug: string
  title_en: string
  title_ko: string | null
  excerpt_en: string
  body_en: string
  hero_image_path: string | null
  /** CSS object-position value, e.g. '50% 50%'. Never null after migration 024. */
  focal_point: string
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
  /** CSS object-position value, e.g. '50% 50%'. */
  focalPoint: string
  category: JournalCategory
  publishedAt: string
  readMinutes: number
}

export type JournalFormInput = {
  slug: string
  title_en: string
  title_ko: string
  excerpt_en: string
  body_en: string
  /** CSS object-position string, e.g. '50% 50%'. Controlled by FocalPointPicker. */
  focal_point: string
  category: JournalCategory
  published_at: string
  read_minutes: number
  is_published: boolean
  experience_id: string | null
  seo_title: string
  seo_description: string
  partner_ids: string[]
}

export const JOURNAL_PUBLIC_COLUMNS =
  "id, slug, title_en, title_ko, excerpt_en, body_en, hero_image_path, focal_point, category, published_at, read_minutes, is_published, experience_id, seo_title, seo_description, created_at, updated_at"

export const JOURNAL_CATEGORIES: JournalCategory[] = [
  "philosophy",
  "space",
  "programs",
  "news",
  "region",
  "taste",
]

export function isJournalCategory(value: string): value is JournalCategory {
  return (JOURNAL_CATEGORIES as string[]).includes(value)
}

export function parseJournalCategoryParam(
  value: string | undefined,
): JournalCategory | "all" {
  if (!value || value === "all") return "all"
  return isJournalCategory(value) ? value : "all"
}
