"use server"

import { getOptionalMemberSession } from "@/lib/auth/require-session"
import { isMemberAuthUser } from "@/lib/auth/member-email"
import { createServiceClient } from "@/lib/supabase/service"
import { validateGuestBookingInput } from "@/lib/bookings/validate"

export type WaitlistState = {
  ok?: boolean
  error?: string
}

export async function joinWaitlist(
  _prev: WaitlistState,
  formData: FormData,
): Promise<WaitlistState> {
  const sessionId = String(formData.get("sessionId") ?? "")
  const guestName = String(formData.get("guestName") ?? "")
  const guestEmail = String(formData.get("guestEmail") ?? "")
  const guestPhone = String(formData.get("guestPhone") ?? "")

  try {
    validateGuestBookingInput({ guestName, guestEmail, guestPhone })
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Invalid input." }
  }

  const memberSession = await getOptionalMemberSession()
  const memberRole = memberSession?.user.app_metadata?.role
  const userId =
    memberSession && memberRole !== "teacher" ? memberSession.userId : null

  const supabase = createServiceClient()

  const { error } = await supabase.rpc("join_waitlist", {
    p_session_id: sessionId,
    p_guest_name: guestName,
    p_guest_email: guestEmail,
    p_guest_phone: guestPhone || null,
    p_user_id: userId,
  })

  if (error) {
    return { error: error.message }
  }

  return { ok: true }
}
