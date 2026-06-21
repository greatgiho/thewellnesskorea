import type { User } from "@supabase/supabase-js"
import { createServiceClient } from "@/lib/supabase/service"
import {
  assertMemberEmailAvailable,
  isMemberAuthUser,
  normalizeMemberEmail,
} from "@/lib/auth/member-email"
import { isAdminAuthUser } from "@/lib/auth/teacher-email"
import { UserFacingError } from "@/lib/errors"

export type MemberOnboardingResult = {
  linkedBookingCount: number
}

export async function linkGuestBookingsToUser(
  userId: string,
  email: string,
): Promise<number> {
  const supabase = createServiceClient()
  const normalized = normalizeMemberEmail(email)

  const { data, error } = await supabase
    .from("bookings")
    .update({ user_id: userId })
    .is("user_id", null)
    .eq("guest_email", normalized)
    .eq("status", "confirmed")
    .select("id")

  if (error) throw new Error(error.message)
  return data?.length ?? 0
}

async function inferMemberName(
  userId: string,
  email: string,
  fallbackName?: string | null,
): Promise<string> {
  const trimmed = fallbackName?.trim()
  if (trimmed) return trimmed

  const supabase = createServiceClient()
  const normalized = normalizeMemberEmail(email)

  const { data, error } = await supabase
    .from("bookings")
    .select("guest_name")
    .eq("guest_email", normalized)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error) throw new Error(error.message)
  if (data?.guest_name?.trim()) return data.guest_name.trim()

  const local = normalized.split("@")[0]
  return local || "Member"
}

export async function upsertMemberProfile(
  userId: string,
  email: string,
  name?: string | null,
  phone?: string | null,
): Promise<void> {
  const supabase = createServiceClient()
  const displayName = await inferMemberName(userId, email, name)

  const { error } = await supabase.from("members").upsert(
    {
      id: userId,
      name: displayName,
      phone: phone?.trim() || null,
    },
    { onConflict: "id" },
  )

  if (error) throw new Error(error.message)
}

export async function completeMemberOnboarding(
  user: User,
  options?: { name?: string | null; phone?: string | null },
): Promise<MemberOnboardingResult> {
  if (!user.email) {
    throw new UserFacingError("Email is required on your account.")
  }

  const appMeta = user.app_metadata as Record<string, unknown> | undefined
  const role = appMeta?.role

  if (role === "teacher") {
    throw new UserFacingError("Teacher accounts cannot use member sign-in.")
  }

  if (isAdminAuthUser(appMeta)) {
    throw new UserFacingError("Admin accounts cannot use member sign-in.")
  }

  if (role == null) {
    const signupIntent = user.user_metadata?.signup_intent
    if (signupIntent !== "member") {
      throw new UserFacingError(
        "This account cannot use member sign-in. Use admin or teacher login instead.",
      )
    }
  }

  const admin = createServiceClient()

  if (!isMemberAuthUser(appMeta)) {
    const { error } = await admin.auth.admin.updateUserById(user.id, {
      app_metadata: { role: "member" },
    })
    if (error) throw new Error(error.message)
  }

  const signupName =
    options?.name ??
    (typeof user.user_metadata?.name === "string"
      ? user.user_metadata.name
      : null)

  await upsertMemberProfile(user.id, user.email, signupName, options?.phone)
  const linkedBookingCount = await linkGuestBookingsToUser(user.id, user.email)

  return { linkedBookingCount }
}

export async function validateMemberSignupEmail(email: string): Promise<void> {
  await assertMemberEmailAvailable(email)
}
