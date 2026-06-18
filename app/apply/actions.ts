"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { linkTeacherPerson, ensureTeacherRole } from "@/lib/apply/teacher-person"
import { teacherApplyCode, siteOrigin } from "@/lib/apply/config"
import { notifyAdminProfileSubmitted } from "@/lib/notifications/admin-alerts"
import {
  personRowFromInput,
  resolvePersonSlug,
  savePersonPrograms,
} from "@/lib/people/persist"
import type {
  PersonFormInput,
  PersonRegistrationStatus,
  PersonRow,
} from "@/lib/people/types"
import { validatePersonInput } from "@/lib/people/validate"
import { isValidEmail } from "@/lib/people/utils"
import { getRegionsForForms } from "@/lib/regions/queries"
import { savePersonActivityRegions } from "@/lib/regions/persist"

async function requireTeacherAuth() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect("/apply")
  if (!user.email) throw new Error("Email is required on your account.")
  return { supabase, user }
}

export async function validateTeacherInviteCode(inviteCode: string): Promise<void> {
  if (inviteCode.trim().toLowerCase() !== teacherApplyCode().toLowerCase()) {
    throw new Error("Invalid invite code.")
  }
}

export async function requestTeacherMagicLink(
  inviteCode: string,
  email: string,
): Promise<void> {
  if (inviteCode.trim().toLowerCase() !== teacherApplyCode().toLowerCase()) {
    throw new Error("Invalid invite code.")
  }
  if (!isValidEmail(email)) {
    throw new Error("Invalid email format.")
  }

  const supabase = await createClient()
  // Keep redirect URL exact (no query string) so Supabase allowlist matches reliably.
  // /auth/callback defaults next=/apply/profile.
  const redirectTo = `${siteOrigin()}/auth/callback`

  const { error } = await supabase.auth.signInWithOtp({
    email: email.trim().toLowerCase(),
    options: {
      emailRedirectTo: redirectTo,
      shouldCreateUser: true,
    },
  })

  if (error) throw new Error(error.message)
}

export async function getTeacherPerson(): Promise<PersonRow | null> {
  const { supabase, user } = await requireTeacherAuth()
  return linkTeacherPerson(supabase, user)
}

type SaveTeacherOptions = {
  submit: boolean
  newPersonId?: string
  photoPath?: string | null
}

function resolveNextStatus(
  previousStatus: PersonRegistrationStatus,
  submit: boolean,
): { status: PersonRegistrationStatus; notify: boolean } {
  if (previousStatus === "approved") {
    return { status: "submitted", notify: true }
  }
  if (submit) {
    return { status: "submitted", notify: true }
  }
  if (previousStatus === "submitted") {
    return { status: "submitted", notify: false }
  }
  return { status: "draft", notify: false }
}

async function persistTeacherProfile(
  input: PersonFormInput,
  person: PersonRow | null,
  options: SaveTeacherOptions,
): Promise<string> {
  const regions = await getRegionsForForms()
  validatePersonInput(input, regions)
  const { supabase, user } = await requireTeacherAuth()
  await ensureTeacherRole(user.id)

  const previousStatus = (person?.registration_status ??
    "draft") as PersonRegistrationStatus
  const { status: nextStatus, notify } = resolveNextStatus(
    previousStatus,
    options.submit,
  )

  const slug = await resolvePersonSlug(supabase, input, person?.id)
  const now = new Date().toISOString()
  const row: Record<string, unknown> = {
    ...personRowFromInput({ ...input, is_published: false }, slug, person?.sort_order ?? 0),
    user_id: user.id,
    registration_status: nextStatus,
    is_published: false,
  }

  if (nextStatus === "submitted" && notify) {
    row.submitted_at = now
    row.reviewed_at = null
    row.reviewed_by = null
    row.rejection_reason = null
  } else if (nextStatus === "submitted") {
    row.submitted_at = person?.submitted_at ?? now
  }

  if (options.photoPath !== undefined) {
    row.photo_path = options.photoPath
  }

  let personId = person?.id

  if (personId) {
    const { error } = await supabase.from("people").update(row).eq("id", personId)
    if (error) throw new Error(error.message)
  } else {
    const insertRow = options.newPersonId
      ? { id: options.newPersonId, ...row }
      : row
    const { data, error } = await supabase
      .from("people")
      .insert(insertRow)
      .select("id")
      .single()
    if (error) throw new Error(error.message)
    personId = data.id as string
  }

  await savePersonPrograms(supabase, personId, input)
  await savePersonActivityRegions(
    supabase,
    personId,
    input.primary_region_code,
    input.secondary_region_code,
  )

  if (notify) {
    await notifyAdminProfileSubmitted({
      personId,
      nameKo: input.name_ko,
      nameEn: input.name_en,
      email: input.email,
      kind: input.kind,
      previousStatus,
    })
  }

  revalidatePath("/apply/profile")
  revalidatePath("/admin/people")

  return personId
}

export async function saveTeacherProfileDraft(
  input: PersonFormInput,
  options?: { newPersonId?: string; photoPath?: string | null },
): Promise<string> {
  const person = await getTeacherPerson()
  return persistTeacherProfile(input, person, {
    submit: false,
    newPersonId: options?.newPersonId,
    photoPath: options?.photoPath,
  })
}

export async function submitTeacherProfile(
  input: PersonFormInput,
  options?: { newPersonId?: string; photoPath?: string | null },
): Promise<string> {
  const person = await getTeacherPerson()
  return persistTeacherProfile(input, person, {
    submit: true,
    newPersonId: options?.newPersonId,
    photoPath: options?.photoPath,
  })
}

export async function signOutTeacher() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect("/apply")
}
