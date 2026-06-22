import { slugify } from "@/lib/partners/utils"
import type { JournalFormInput, JournalPostRow } from "./types"

export function emptyJournalInput(): JournalFormInput {
  const today = new Date().toISOString().slice(0, 10)
  return {
    slug: "",
    title_en: "",
    title_ko: "",
    excerpt_en: "",
    body_en: "",
    category: "news",
    published_at: today,
    read_minutes: 5,
    is_published: false,
    experience_id: null,
    seo_title: "",
    seo_description: "",
    partner_ids: [],
  }
}

export function journalInputFromPost(
  post: JournalPostRow,
  partnerIds: string[] = [],
): JournalFormInput {
  return {
    slug: post.slug,
    title_en: post.title_en,
    title_ko: post.title_ko ?? "",
    excerpt_en: post.excerpt_en,
    body_en: post.body_en,
    category: post.category,
    published_at: post.published_at.slice(0, 10),
    read_minutes: post.read_minutes,
    is_published: post.is_published,
    experience_id: post.experience_id,
    seo_title: post.seo_title ?? "",
    seo_description: post.seo_description ?? "",
    partner_ids: partnerIds,
  }
}

export function slugFromJournalTitle(title: string): string {
  return slugify(title)
}
