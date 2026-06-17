import {
  provisionTeacherAccount,
  syncTeacherAuthEmail,
} from "@/lib/auth/provision-teacher-account"
import { sendTeacherCredentialsEmail } from "@/lib/notifications/teacher-credentials-email"
import { createServiceClient } from "@/lib/supabase/service"
import type { SupabaseClient } from "@supabase/supabase-js"

type PersonAccountRow = {
  id: string
  email: string | null
  name_ko: string
  user_id: string | null
}

export async function linkPersonToAuthUser(
  supabase: SupabaseClient,
  personId: string,
  userId: string,
): Promise<void> {
  const { error } = await supabase
    .from("people")
    .update({ user_id: userId })
    .eq("id", personId)

  if (error) throw new Error(error.message)
}

async function loadPersonForAccount(
  supabase: SupabaseClient,
  personId: string,
): Promise<PersonAccountRow> {
  const { data, error } = await supabase
    .from("people")
    .select("id, email, name_ko, user_id")
    .eq("id", personId)
    .maybeSingle()

  if (error) throw new Error(error.message)
  if (!data) throw new Error("Person not found.")

  return data as PersonAccountRow
}

export async function provisionAndEmailTeacherAccount(
  supabase: SupabaseClient,
  personId: string,
  options?: { isReissue?: boolean },
): Promise<void> {
  const person = await loadPersonForAccount(supabase, personId)
  const email = person.email?.trim()
  if (!email) {
    throw new Error("Email is required to provision a teacher account.")
  }

  const { userId, tempPassword } = await provisionTeacherAccount({
    email,
    existingUserId: person.user_id,
  })

  await linkPersonToAuthUser(supabase, personId, userId)

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
    await syncTeacherAuthEmail(params.previousUserId, email)
    return false
  }

  if (params.previousUserId) return false
  if (params.registrationStatus !== "admin") return false

  await provisionAndEmailTeacherAccount(supabase, personId)
  return true
}

export function mustChangePassword(
  user: { user_metadata?: Record<string, unknown> } | null,
): boolean {
  return user?.user_metadata?.must_change_password === true
}

export async function getTeacherPersonByUserId(userId: string) {
  const admin = createServiceClient()
  const { data, error } = await admin
    .from("people")
    .select("id, name_ko, name_en, email, user_id, registration_status")
    .eq("user_id", userId)
    .maybeSingle()

  if (error) throw new Error(error.message)
  return data
}
