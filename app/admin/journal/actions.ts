"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { requireAdminSession } from "@/lib/auth/require-session"
import { estimateReadMinutes } from "@/lib/journal/body"
import { sanitizeJournalHtml } from "@/lib/journal/sanitize"
import { syncJournalPostPartners } from "@/lib/journal/partners"
import { removeJournalPostStorage } from "@/lib/journal/storage-cleanup"
import type { JournalFormInput } from "@/lib/journal/types"

export type JournalSaveResult =
  | { ok: true; postId: string }
  | { ok: false; error: string }

function revalidateJournalCaches(slug?: string) {
  revalidatePath("/journal")
  revalidatePath("/admin/journal")
  if (slug) revalidatePath(`/journal/${slug}`)
  revalidatePath("/")
}

function validateJournalInput(input: JournalFormInput): string | null {
  if (!input.title_en.trim()) return "Title is required."
  if (!input.slug.trim()) return "Slug is required."
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(input.slug.trim())) {
    return "Slug must be lowercase letters, numbers, and hyphens only."
  }
  if (!input.excerpt_en.trim()) return "Excerpt is required."
  if (input.read_minutes <= 0) return "Read time must be greater than 0."
  return null
}

function rowFromInput(input: JournalFormInput, heroPath: string | null) {
  const bodyHtml = sanitizeJournalHtml(input.body_en)
  const readMinutes =
    input.read_minutes > 0
      ? input.read_minutes
      : estimateReadMinutes(bodyHtml)

  return {
    slug: input.slug.trim(),
    title_en: input.title_en.trim(),
    title_ko: input.title_ko.trim() || null,
    excerpt_en: input.excerpt_en.trim(),
    body_en: bodyHtml,
    hero_image_path: heroPath,
    category: input.category,
    published_at: new Date(`${input.published_at}T12:00:00.000Z`).toISOString(),
    read_minutes: readMinutes,
    is_published: input.is_published,
    experience_id: input.experience_id || null,
    seo_title: input.seo_title.trim() || null,
    seo_description: input.seo_description.trim() || null,
  }
}

export type SaveJournalOptions = {
  newPostId?: string
  heroPath?: string | null
}

export async function saveJournalPost(
  input: JournalFormInput,
  postId?: string,
  options?: SaveJournalOptions,
): Promise<JournalSaveResult> {
  const validationError = validateJournalInput(input)
  if (validationError) return { ok: false, error: validationError }

  try {
    const { supabase } = await requireAdminSession()

    if (postId) {
      const { data: existing, error: fetchError } = await supabase
        .from("journal_posts")
        .select("hero_image_path, slug")
        .eq("id", postId)
        .maybeSingle()

      if (fetchError) throw new Error(fetchError.message)

      let heroPath = existing?.hero_image_path ?? null
      if (options?.heroPath !== undefined) {
        const oldPath = existing?.hero_image_path
        if (oldPath && oldPath !== options.heroPath && !oldPath.startsWith("/")) {
          await supabase.storage.from("journal-photos").remove([oldPath])
        }
        heroPath = options.heroPath
      }

      const { error } = await supabase
        .from("journal_posts")
        .update(rowFromInput(input, heroPath))
        .eq("id", postId)

      if (error) throw new Error(error.message)

      await syncJournalPostPartners(supabase, postId, input.partner_ids)

      revalidateJournalCaches(input.slug.trim())
      return { ok: true, postId }
    }

    const insertRow = {
      ...(options?.newPostId ? { id: options.newPostId } : {}),
      ...rowFromInput(input, options?.heroPath ?? null),
    }

    const { data, error } = await supabase
      .from("journal_posts")
      .insert(insertRow)
      .select("id")
      .single()

    if (error) throw new Error(error.message)

    await syncJournalPostPartners(supabase, data.id, input.partner_ids)

    revalidateJournalCaches(input.slug.trim())
    return { ok: true, postId: data.id }
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Failed to save post.",
    }
  }
}

export async function deleteJournalPost(postId: string) {
  const { supabase } = await requireAdminSession()

  const { data: existing, error: fetchError } = await supabase
    .from("journal_posts")
    .select("slug, hero_image_path")
    .eq("id", postId)
    .maybeSingle()

  if (fetchError) throw new Error(fetchError.message)

  const { error } = await supabase.from("journal_posts").delete().eq("id", postId)
  if (error) throw new Error(error.message)

  await removeJournalPostStorage(supabase, postId, existing?.hero_image_path)

  revalidateJournalCaches(existing?.slug)
  redirect("/admin/journal")
}
