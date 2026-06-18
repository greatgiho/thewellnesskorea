export type ExperienceKind = "space" | "journey"

export type ExperienceRow = {
  id: string
  slug: string
  kind: ExperienceKind
  name_en: string
  name_ko: string | null
  hero_image_path: string | null
  headline_en: string | null
  description_en: string | null
  secondary_link_label_en: string | null
  secondary_link_href: string | null
  sort_order: number
  is_published: boolean
  schedule_enabled: boolean
  created_at: string
  updated_at: string
}

export const EXPERIENCE_PUBLIC_COLUMNS =
  "id, slug, kind, name_en, name_ko, hero_image_path, headline_en, description_en, secondary_link_label_en, secondary_link_href, sort_order, is_published, schedule_enabled"
