"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { requireAdminSession } from "@/lib/auth/require-session"
import { isUserFacingError } from "@/lib/errors"
import { persistPartner } from "@/lib/partners/persist-partner"
import type { PartnerFormInput } from "@/lib/partners/types"

function revalidatePartnerCaches(isPublished: boolean, personId?: string, slug?: string) {
  revalidatePath("/admin/partners")
  if (personId) revalidatePath(`/admin/partners/${personId}/edit`)
  if (isPublished) revalidatePath("/")
  if (slug) revalidatePath(`/partners/${slug}`)
}

export type SavePersonOptions = {
  newPersonId?: string
  photoPath?: string | null
}

export type PartnerSaveResult =
  | { ok: true; personId: string }
  | { ok: false; error: string }

export async function signOut() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect("/admin/login")
}

export async function savePartner(
  input: PartnerFormInput,
  personId?: string,
  options?: SavePersonOptions,
): Promise<PartnerSaveResult> {
  try {
    const { supabase } = await requireAdminSession()
    const result = await persistPartner(supabase, input, {
      mode: "admin",
      personId,
      options,
    })
    revalidatePartnerCaches(result.isPublished, result.personId, result.slug)
    return { ok: true, personId: result.personId }
  } catch (error) {
    if (isUserFacingError(error) || error instanceof Error) {
      return {
        ok: false,
        error: error.message || "저장에 실패했습니다.",
      }
    }
    console.error("[savePartner]", error)
    return { ok: false, error: "저장에 실패했습니다. 잠시 후 다시 시도해 주세요." }
  }
}

export async function createPerson(input: PartnerFormInput) {
  return savePartner(input)
}

export async function updatePerson(id: string, input: PartnerFormInput) {
  return savePartner(input, id)
}

export async function updatePersonPhotoPath(id: string, photoPath: string) {
  const { supabase } = await requireAdminSession()

  const { data: existing } = await supabase
    .from("partners")
    .select("photo_path, is_published")
    .eq("id", id)
    .maybeSingle()

  const { error } = await supabase
    .from("partners")
    .update({ photo_path: photoPath })
    .eq("id", id)

  if (error) throw new Error(error.message)

  const oldPath = existing?.photo_path
  if (oldPath && oldPath !== photoPath) {
    await supabase.storage.from("person-photos").remove([oldPath])
  }

  revalidatePartnerCaches(existing?.is_published ?? false, id)
}

export async function deletePartner(id: string) {
  const { supabase } = await requireAdminSession()

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
    .from("partners")
    .select("photo_path, is_published")
    .eq("id", id)
    .maybeSingle()

  if (person?.photo_path) {
    await supabase.storage.from("person-photos").remove([person.photo_path])
  }

  const { error } = await supabase.from("partners").delete().eq("id", id)
  if (error) throw new Error(error.message)

  revalidatePartnerCaches(person?.is_published ?? false)
}
