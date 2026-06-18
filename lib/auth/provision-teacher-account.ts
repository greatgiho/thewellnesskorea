import { generateTempPassword } from "@/lib/auth/temp-password"
import {
  assertTeacherEmailAvailable,
  findAuthUserByEmail,
} from "@/lib/auth/teacher-email"
import { UserFacingError } from "@/lib/errors"
import { createServiceClient } from "@/lib/supabase/service"

export type ProvisionTeacherResult = {
  userId: string
  tempPassword: string
  isNewUser: boolean
}

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase()
}

async function upsertTeacherAuthUser(
  email: string,
  tempPassword: string,
  existingUserId?: string | null,
): Promise<{ userId: string; isNewUser: boolean }> {
  const admin = createServiceClient()
  const normalized = normalizeEmail(email)
  const metadata = {
    must_change_password: true,
  }
  const appMetadata = { role: "teacher" as const }

  if (existingUserId) {
    const { error } = await admin.auth.admin.updateUserById(existingUserId, {
      email: normalized,
      password: tempPassword,
      email_confirm: true,
      user_metadata: metadata,
      app_metadata: appMetadata,
    })
    if (error) throw new Error(error.message)
    return { userId: existingUserId, isNewUser: false }
  }

  const existing = await findAuthUserByEmail(normalized)
  if (existing) {
    await assertTeacherEmailAvailable(normalized, {
      excludeUserId: existingUserId ?? existing.id,
    })
    const { error } = await admin.auth.admin.updateUserById(existing.id, {
      password: tempPassword,
      email_confirm: true,
      user_metadata: metadata,
      app_metadata: appMetadata,
    })
    if (error) throw new Error(error.message)
    return { userId: existing.id, isNewUser: false }
  }

  const { data, error } = await admin.auth.admin.createUser({
    email: normalized,
    password: tempPassword,
    email_confirm: true,
    user_metadata: metadata,
    app_metadata: appMetadata,
  })
  if (error) throw new Error(error.message)
  if (!data.user) throw new Error("Failed to create teacher account.")

  return { userId: data.user.id, isNewUser: true }
}

export async function provisionTeacherAccount(params: {
  email: string
  existingUserId?: string | null
}): Promise<ProvisionTeacherResult> {
  const email = params.email.trim()
  if (!email) {
    throw new UserFacingError("Email is required to provision a teacher account.")
  }

  await assertTeacherEmailAvailable(email, {
    excludeUserId: params.existingUserId,
  })

  const tempPassword = generateTempPassword()
  const { userId, isNewUser } = await upsertTeacherAuthUser(
    email,
    tempPassword,
    params.existingUserId,
  )

  return { userId, tempPassword, isNewUser }
}

export { syncTeacherAuthEmail } from "@/lib/auth/teacher-email"

export async function clearMustChangePassword(userId: string): Promise<void> {
  const admin = createServiceClient()
  const { data, error } = await admin.auth.admin.getUserById(userId)
  if (error || !data.user) throw new Error(error?.message ?? "User not found.")

  const { error: updateError } = await admin.auth.admin.updateUserById(userId, {
    user_metadata: {
      ...data.user.user_metadata,
      must_change_password: false,
    },
  })
  if (updateError) throw new Error(updateError.message)
}
