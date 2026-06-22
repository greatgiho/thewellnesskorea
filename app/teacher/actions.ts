"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import {
  clearMustChangePassword,
  provisionTeacherAccount,
} from "@/lib/auth/provision-teacher-account"
import { getTeacherPartnerByUserId } from "@/lib/auth/teacher-account"
import { sendTeacherCredentialsEmail } from "@/lib/notifications/teacher-credentials-email"
import { createClient } from "@/lib/supabase/server"

async function requireTeacher() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect("/teacher/login")
  if (user.app_metadata?.role === "admin") redirect("/admin/partners")
  return { supabase, user }
}

export async function teacherSignOut() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect("/teacher/login")
}

export async function changeTeacherPassword(
  currentPassword: string,
  newPassword: string,
) {
  const { supabase, user } = await requireTeacher()
  if (!user.email) throw new Error("Account email is missing.")

  const { error: signInError } = await supabase.auth.signInWithPassword({
    email: user.email,
    password: currentPassword,
  })
  if (signInError) throw new Error("Current password is incorrect.")

  const { error: updateError } = await supabase.auth.updateUser({
    password: newPassword,
    data: { must_change_password: false },
  })
  if (updateError) throw new Error(updateError.message)

  await clearMustChangePassword(user.id)
  revalidatePath("/teacher")
  revalidatePath("/teacher/change-password")
}

export async function requestTeacherPasswordReissue() {
  const { user } = await requireTeacher()
  if (!user.email) throw new Error("Account email is missing.")

  const person = await getTeacherPartnerByUserId(user.id)
  if (!person) {
    throw new Error("Teacher profile not found.")
  }

  const { tempPassword } = await provisionTeacherAccount({
    email: user.email,
    existingUserId: user.id,
  })

  await sendTeacherCredentialsEmail({
    email: user.email,
    nameKo: person.name_ko,
    tempPassword,
    isReissue: true,
  })
}
