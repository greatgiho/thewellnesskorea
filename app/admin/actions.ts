"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import type { PersonFormInput, PersonRegistrationStatus } from "@/lib/people/types"
import {
  personRowFromInput,
  resolvePersonSlug,
  savePersonPrograms,
} from "@/lib/people/persist"
import {
  maybeProvisionOnAdminSave,
  provisionAndEmailTeacherAccount,
} from "@/lib/auth/teacher-account"
import { canPublishPerson } from "@/lib/people/registration-status"
import { validatePersonInput } from "@/lib/people/validate"

async function requireAuth() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect("/admin/login")
  return { supabase, user }
}

function revalidatePersonCaches(isPublished: boolean, personId?: string) {
  revalidatePath("/admin/people")
  if (personId) revalidatePath(`/admin/people/${personId}/edit`)
  if (isPublished) revalidatePath("/")
}

export type SavePersonOptions = {
  newPersonId?: string
  photoPath?: string | null
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
  validatePersonInput(input)
  const { supabase } = await requireAuth()
  const slug = await resolvePersonSlug(supabase, input, personId)

  let sortOrder = 0
  let existingPhotoPath: string | null = null
  let registrationStatus: PersonRegistrationStatus = "admin"
  let existingEmail: string | null = null
  let existingUserId: string | null = null

  if (personId) {
    const { data: existing } = await supabase
      .from("people")
      .select(
        "sort_order, photo_path, registration_status, is_published, email, user_id",
      )
      .eq("id", personId)
      .maybeSingle()

    sortOrder = existing?.sort_order ?? 0
    existingPhotoPath = existing?.photo_path ?? null
    registrationStatus = (existing?.registration_status ??
      "admin") as PersonRegistrationStatus
    existingEmail = existing?.email ?? null
    existingUserId = existing?.user_id ?? null

    if (
      input.is_published &&
      !canPublishPerson(registrationStatus)
    ) {
      throw new Error("Profile must be approved before publishing.")
    }
  }

  const row = personRowFromInput(input, slug, sortOrder) as ReturnType<
    typeof personRowFromInput
  > & { photo_path?: string | null; registration_status?: string }

  if (!personId) {
    row.registration_status = "admin"
  }

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
    await savePersonPrograms(supabase, personId, input)
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
    await savePersonPrograms(supabase, personId, input)
  }

  await maybeProvisionOnAdminSave(supabase, personId, {
    email: input.email,
    previousEmail: existingEmail,
    previousUserId: existingUserId,
    registrationStatus,
  })

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
  const { supabase } = await requireAuth()

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

export async function approvePerson(personId: string) {
  const { supabase, user } = await requireAuth()
  const now = new Date().toISOString()

  const { data: person, error: loadError } = await supabase
    .from("people")
    .select("email")
    .eq("id", personId)
    .maybeSingle()

  if (loadError) throw new Error(loadError.message)
  if (!person?.email?.trim()) {
    throw new Error("Email is required before approval.")
  }

  const { error } = await supabase
    .from("people")
    .update({
      registration_status: "approved",
      reviewed_at: now,
      reviewed_by: user.id,
      rejection_reason: null,
    })
    .eq("id", personId)

  if (error) throw new Error(error.message)

  await provisionAndEmailTeacherAccount(supabase, personId)
  revalidatePersonCaches(false, personId)
}

export async function reissueTeacherPassword(personId: string) {
  const { supabase } = await requireAuth()
  await provisionAndEmailTeacherAccount(supabase, personId, {
    isReissue: true,
  })
}

export async function rejectPerson(personId: string, reason: string) {
  const { supabase, user } = await requireAuth()
  const trimmed = reason.trim()
  if (!trimmed) throw new Error("Rejection reason is required.")

  const { error } = await supabase
    .from("people")
    .update({
      registration_status: "rejected",
      reviewed_at: new Date().toISOString(),
      reviewed_by: user.id,
      rejection_reason: trimmed,
      is_published: false,
    })
    .eq("id", personId)

  if (error) throw new Error(error.message)
  revalidatePersonCaches(false, personId)
}

export async function deletePerson(id: string) {
  const { supabase } = await requireAuth()

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
