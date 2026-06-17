import type { SupabaseClient } from "@supabase/supabase-js"
import type { PersonFormInput, PersonKind } from "./types"
import { normalizeInstagram, slugify } from "./utils"

export async function uniqueSlug(
  supabase: SupabaseClient,
  base: string,
  excludeId?: string,
): Promise<string> {
  let slug = base
  let n = 1
  while (true) {
    let query = supabase.from("people").select("id").eq("slug", slug)
    if (excludeId) query = query.neq("id", excludeId)
    const { data } = await query.maybeSingle()
    if (!data) return slug
    n += 1
    slug = `${base}-${n}`
  }
}

export function personRowFromInput(
  input: PersonFormInput,
  slug: string,
  sortOrder: number,
) {
  return {
    slug,
    kind: input.kind as PersonKind,
    name_ko: input.name_ko.trim(),
    name_en: input.name_en.trim(),
    role_ko: input.role_ko.trim(),
    role_en: input.role_en.trim(),
    quote: input.quote.trim() || null,
    phone: input.phone.trim() || null,
    email: input.email.trim().toLowerCase() || null,
    instagram: normalizeInstagram(input.instagram),
    modalities: input.programs.map((p) => p.title.trim()),
    sort_order: sortOrder,
    is_published: input.is_published,
  }
}

export async function savePersonPrograms(
  supabase: SupabaseClient,
  personId: string,
  input: PersonFormInput,
) {
  const { error: deleteError } = await supabase
    .from("person_programs")
    .delete()
    .eq("person_id", personId)

  if (deleteError) throw new Error(deleteError.message)

  if (input.programs.length === 0) return

  const rows = input.programs.map((program, index) => ({
    person_id: personId,
    title: program.title.trim(),
    description: program.description.trim() || null,
    path_keys: program.path_keys,
    sort_order: index,
  }))

  const { error: insertError } = await supabase.from("person_programs").insert(rows)
  if (insertError) throw new Error(insertError.message)
}

export async function resolvePersonSlug(
  supabase: SupabaseClient,
  input: PersonFormInput,
  personId?: string,
): Promise<string> {
  const baseSlug = slugify(input.name_en)
  if (!baseSlug) {
    throw new Error("English name is required for profile URL.")
  }
  return uniqueSlug(supabase, baseSlug, personId)
}
