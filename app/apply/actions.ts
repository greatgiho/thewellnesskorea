"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { linkTeacherPartner, ensureTeacherRole } from "@/lib/apply/teacher-partner"
import { teacherApplyCode, siteOrigin } from "@/lib/apply/config"
import { requireTeacherSession } from "@/lib/auth/require-session"
import { persistPartner } from "@/lib/partners/persist-partner"
import type { PartnerFormInput, PartnerRow } from "@/lib/partners/types"
import { isValidEmail } from "@/lib/partners/utils"

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

export async function getTeacherPerson(): Promise<PartnerRow | null> {
  const { supabase, user } = await requireTeacherSession()
  return linkTeacherPartner(supabase, user)
}

async function persistTeacherProfile(
  input: PartnerFormInput,
  person: PartnerRow | null,
  options: {
    submit: boolean
    newPersonId?: string
    photoPath?: string | null
  },
): Promise<string> {
  const { supabase, user } = await requireTeacherSession()
  await ensureTeacherRole(user.id)

  const result = await persistPartner(supabase, input, {
    mode: "teacher",
    person,
    userId: user.id,
    submit: options.submit,
    options: {
      newPersonId: options.newPersonId,
      photoPath: options.photoPath,
    },
  })

  revalidatePath("/apply/profile")
  revalidatePath("/admin/partners")

  return result.personId
}

export async function saveTeacherProfileDraft(
  input: PartnerFormInput,
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
  input: PartnerFormInput,
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
