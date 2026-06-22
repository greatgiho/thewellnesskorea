import {
  provisionTeacherAccount,
} from "@/lib/auth/provision-teacher-account"
import { resolveEmailChangeOnAdminSave } from "@/lib/auth/teacher-email"
import { sendTeacherCredentialsEmail } from "@/lib/notifications/teacher-credentials-email"
import { createServiceClient } from "@/lib/supabase/service"
import type { SupabaseClient } from "@supabase/supabase-js"

type PartnerAccountRow = {
  id: string
  email: string | null
  name_ko: string
  user_id: string | null
}

export async function linkPartnerToAuthUser(
  supabase: SupabaseClient,
  personId: string,
  userId: string,
): Promise<void> {
  const { error } = await supabase
    .from("partners")
    .update({ user_id: userId })
    .eq("id", personId)

  if (error) throw new Error(error.message)
}

async function loadPartnerForAccount(
  supabase: SupabaseClient,
  personId: string,
): Promise<PartnerAccountRow> {
  const { data, error } = await supabase
    .from("partners")
    .select("id, email, name_ko, user_id")
    .eq("id", personId)
    .maybeSingle()

  if (error) throw new Error(error.message)
  if (!data) throw new Error("Person not found.")

  return data as PartnerAccountRow
}

export async function provisionAndEmailTeacherAccount(
  supabase: SupabaseClient,
  personId: string,
  options?: { isReissue?: boolean },
): Promise<void> {
  const person = await loadPartnerForAccount(supabase, personId)
  const email = person.email?.trim()
  if (!email) {
    throw new Error("Email is required to provision a teacher account.")
  }

  const { userId, tempPassword } = await provisionTeacherAccount({
    email,
    existingUserId: person.user_id,
  })

  await linkPartnerToAuthUser(supabase, personId, userId)

  await sendTeacherCredentialsEmail({
    email,
    nameKo: person.name_ko,
    tempPassword,
    isReissue: options?.isReissue,
  })
}

export async function maybeProvisionOnAdminSave(
  supabase: SupabaseClient,
  personId: string,
  params: {
    email: string
    previousEmail: string | null
    previousUserId: string | null
    registrationStatus: string
  },
): Promise<boolean> {
  const email = params.email.trim()
  if (!email) return false

  if (
    params.previousUserId &&
    params.previousEmail &&
    email.toLowerCase() !== params.previousEmail.trim().toLowerCase()
  ) {
    await resolveEmailChangeOnAdminSave({
      previousUserId: params.previousUserId,
      previousEmail: params.previousEmail,
      newEmail: email,
    })
    return false
  }

  if (params.previousUserId) return false
  if (params.registrationStatus !== "admin") return false

  await provisionAndEmailTeacherAccount(supabase, personId)
  return true
}

export async function getTeacherPartnerByUserId(userId: string) {
  const admin = createServiceClient()
  const { data, error } = await admin
    .from("partners")
    .select("id, name_ko, name_en, email, user_id, registration_status")
    .eq("user_id", userId)
    .maybeSingle()

  if (error) throw new Error(error.message)
  return data
}

/** Remove Supabase Auth user when admin deletes a linked teacher profile. */
export async function deleteLinkedTeacherAuthUser(
  userId: string,
): Promise<void> {
  const admin = createServiceClient()
  const { data, error } = await admin.auth.admin.getUserById(userId)
  if (error) throw new Error(error.message)

  const role = data.user?.app_metadata?.role
  if (role !== "teacher") return

  const { error: deleteError } = await admin.auth.admin.deleteUser(userId)
  if (deleteError) {
    throw new Error(
      `Partner profile was deleted, but the teacher login could not be removed: ${deleteError.message}`,
    )
  }
}
