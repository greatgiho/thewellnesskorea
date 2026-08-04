"use server"

import { revalidatePath } from "next/cache"
import { createServiceClient } from "@/lib/supabase/service"
import { requireAdminSession } from "@/lib/auth/require-session"

export type MemberBanResult = { ok: true } | { ok: false; error: string }

// Supabase has no "ban forever" — it takes a duration, so bans are set far
// enough out to be permanent in practice and lifted with "none".
const FOREVER = "876000h" // 100 years

/**
 * Block or restore a member's sign-in.
 *
 * This is an auth-level ban rather than a column on `members`: it takes effect
 * on the next sign-in attempt with no schema change, and it cannot be bypassed
 * by any code path that forgets to check a flag. Existing bookings are left
 * untouched — blocking an account is not a cancellation.
 */
export async function setMemberBanned(
  memberId: string,
  banned: boolean,
): Promise<MemberBanResult> {
  const { userId } = await requireAdminSession()

  if (memberId === userId) {
    return { ok: false, error: "You cannot ban your own account." }
  }

  const service = createServiceClient()

  // Refuse to touch anything that is not a member — an admin or partner
  // account reached by a hand-edited URL must not be bannable from here.
  const { data: target, error: lookupError } =
    await service.auth.admin.getUserById(memberId)
  if (lookupError) return { ok: false, error: lookupError.message }

  const role = target?.user?.app_metadata?.role
  if (role && role !== "member") {
    return { ok: false, error: `This is not a member account (role=${role}).` }
  }

  const { error } = await service.auth.admin.updateUserById(memberId, {
    ban_duration: banned ? FOREVER : "none",
  })
  if (error) return { ok: false, error: error.message }

  revalidatePath("/a/members")
  revalidatePath(`/a/members/${memberId}`)
  return { ok: true }
}
