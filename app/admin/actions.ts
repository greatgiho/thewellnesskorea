"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import type { PersonFormInput, PersonKind } from "@/lib/people/types"
import {
  isValidEmail,
  normalizeInstagram,
  slugify,
} from "@/lib/people/utils"

async function requireAuth() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect("/admin/login")
  return supabase
}

async function uniqueSlug(
  supabase: Awaited<ReturnType<typeof createClient>>,
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

function validateInput(input: PersonFormInput): void {
  if (!isValidEmail(input.email)) {
    throw new Error("Invalid email format.")
  }
  for (const program of input.programs) {
    if (!program.title.trim()) {
      throw new Error("Each program needs a title.")
    }
    if (program.path_keys.length === 0) {
      throw new Error(`Select at least one philosophy path for “${program.title.trim()}”.`)
    }
  }
}

function revalidatePersonCaches(isPublished: boolean, personId?: string) {
  revalidatePath("/admin/people")
  if (personId) revalidatePath(`/admin/people/${personId}/edit`)
  if (isPublished) revalidatePath("/")
}

function rowFromInput(input: PersonFormInput, slug: string, sortOrder: number) {
  return {
    slug,
    kind: input.kind as PersonKind,
    name_ko: input.name_ko.trim(),
    name_en: input.name_en.trim(),
    role_ko: input.role_ko.trim(),
    role_en: input.role_en.trim(),
    quote: input.quote.trim() || null,
    phone: input.phone.trim() || null,
    email: input.email.trim() || null,
    instagram: normalizeInstagram(input.instagram),
    modalities: input.programs.map((p) => p.title.trim()),
    sort_order: sortOrder,
    is_published: input.is_published,
  }
}

export type SavePersonOptions = {
  newPersonId?: string
  photoPath?: string | null
}

async function savePrograms(
  supabase: Awaited<ReturnType<typeof createClient>>,
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

export async function signOut() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect("/admin/login")
}

export async function savePerson(
  input: PersonFormInput,
  personId?: string,
  options?: SavePersonOptions,
) {
  validateInput(input)
  const supabase = await requireAuth()
  const baseSlug = slugify(input.name_en)
  const slug = await uniqueSlug(supabase, baseSlug, personId)

  let sortOrder = 0
  let existingPhotoPath: string | null = null
  if (personId) {
    const { data: existing } = await supabase
      .from("people")
      .select("sort_order, photo_path")
      .eq("id", personId)
      .maybeSingle()
    sortOrder = existing?.sort_order ?? 0
    existingPhotoPath = existing?.photo_path ?? null
  }

  const row = rowFromInput(input, slug, sortOrder) as ReturnType<
    typeof rowFromInput
  > & { photo_path?: string | null }

  if (options?.photoPath !== undefined) {
    row.photo_path = options.photoPath
  } else if (!personId) {
    row.photo_path = null
  }

  if (
    personId &&
    options?.photoPath &&
    existingPhotoPath &&
    existingPhotoPath !== options.photoPath
  ) {
    await supabase.storage.from("person-photos").remove([existingPhotoPath])
  }

  if (personId) {
    const { error } = await supabase.from("people").update(row).eq("id", personId)
    if (error) throw new Error(error.message)
    await savePrograms(supabase, personId, input)
  } else {
    const insertRow = options?.newPersonId
      ? { id: options.newPersonId, ...row }
      : row
    const { data, error } = await supabase
      .from("people")
      .insert(insertRow)
      .select("id")
      .single()
    if (error) throw new Error(error.message)
    personId = data.id as string
    await savePrograms(supabase, personId, input)
  }

  revalidatePersonCaches(input.is_published, personId)

  return personId
}

export async function createPerson(input: PersonFormInput) {
  return savePerson(input)
}

export async function updatePerson(id: string, input: PersonFormInput) {
  return savePerson(input, id)
}

export async function updatePersonPhotoPath(id: string, photoPath: string) {
  const supabase = await requireAuth()

  const { data: existing } = await supabase
    .from("people")
    .select("photo_path, is_published")
    .eq("id", id)
    .maybeSingle()

  const { error } = await supabase
    .from("people")
    .update({ photo_path: photoPath })
    .eq("id", id)

  if (error) throw new Error(error.message)

  const oldPath = existing?.photo_path
  if (oldPath && oldPath !== photoPath) {
    await supabase.storage.from("person-photos").remove([oldPath])
  }

  revalidatePersonCaches(existing?.is_published ?? false, id)
}

export async function deletePerson(id: string) {
  const supabase = await requireAuth()

  const { count: sessionCount, error: sessionCountError } = await supabase
    .from("sessions")
    .select("id", { count: "exact", head: true })
    .eq("instructor_id", id)

  if (sessionCountError) throw new Error(sessionCountError.message)
  if (sessionCount && sessionCount > 0) {
    throw new Error(
      "Cannot delete: this instructor has scheduled sessions. Remove or reassign them first.",
    )
  }

  const { data: person } = await supabase
    .from("people")
    .select("photo_path, is_published")
    .eq("id", id)
    .maybeSingle()

  if (person?.photo_path) {
    await supabase.storage.from("person-photos").remove([person.photo_path])
  }

  const { error } = await supabase.from("people").delete().eq("id", id)
  if (error) throw new Error(error.message)

  revalidatePersonCaches(person?.is_published ?? false)
}
