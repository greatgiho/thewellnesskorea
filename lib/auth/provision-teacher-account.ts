import type { User } from "@supabase/supabase-js"
import { generateTempPassword } from "@/lib/auth/temp-password"
import { createServiceClient } from "@/lib/supabase/service"

export type ProvisionTeacherResult = {
  userId: string
  tempPassword: string
  isNewUser: boolean
}

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase()
}

async function findUserByEmail(email: string): Promise<User | null> {
  const admin = createServiceClient()
  const normalized = normalizeEmail(email)
  let page = 1

  while (true) {
    const { data, error } = await admin.auth.admin.listUsers({
      page,
      perPage: 200,
    })
    if (error) throw new Error(error.message)

    const match = data.users.find(
      (u) => u.email?.toLowerCase() === normalized,
    )
    if (match) return match

    if (data.users.length < 200) break
    page++
  }

  return null
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

  const existing = await findUserByEmail(normalized)
  if (existing) {
    if (existing.app_metadata?.role === "admin") {
      throw new Error(
        "This email is already used by an admin account. Use a different email.",
      )
    }
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
    throw new Error("Email is required to provision a teacher account.")
  }

  const tempPassword = generateTempPassword()
  const { userId, isNewUser } = await upsertTeacherAuthUser(
    email,
    tempPassword,
    params.existingUserId,
  )

  return { userId, tempPassword, isNewUser }
}

export async function syncTeacherAuthEmail(
  userId: string,
  email: string,
): Promise<void> {
  const normalized = normalizeEmail(email)
  if (!normalized) return

  const admin = createServiceClient()
  const { error } = await admin.auth.admin.updateUserById(userId, {
    email: normalized,
    email_confirm: true,
  })
  if (error) throw new Error(error.message)
}

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
