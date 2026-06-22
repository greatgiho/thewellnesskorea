"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { isRedirectError } from "next/dist/client/components/redirect-error"
import { siteOrigin } from "@/lib/apply/config"
import { completeMemberOnboarding, validateMemberSignupEmail } from "@/lib/auth/member-account"
import { requireMemberSession } from "@/lib/auth/require-session"
import { cancelBookingForUserRpc } from "@/lib/bookings/rpc"
import { isValidEmail } from "@/lib/partners/utils"
import { createClient } from "@/lib/supabase/server"

export type MemberCancelState = {
  error?: string
}

function memberAuthRedirect(next = "/account/bookings"): string {
  const params = new URLSearchParams({ next })
  return `${siteOrigin()}/auth/callback?${params.toString()}`
}

export async function requestMemberLoginLink(email: string): Promise<void> {
  const normalized = email.trim().toLowerCase()
  if (!isValidEmail(normalized)) {
    throw new Error("Please enter a valid email address.")
  }

  await validateMemberSignupEmail(normalized)

  const supabase = await createClient()
  const { error } = await supabase.auth.signInWithOtp({
    email: normalized,
    options: {
      emailRedirectTo: memberAuthRedirect(),
      shouldCreateUser: true,
      data: { signup_intent: "member" },
    },
  })

  if (error) throw new Error(error.message)
}

export async function requestMemberSignupLink(
  name: string,
  email: string,
): Promise<void> {
  const trimmedName = name.trim()
  const normalized = email.trim().toLowerCase()

  if (!trimmedName) {
    throw new Error("Please enter your name.")
  }
  if (!isValidEmail(normalized)) {
    throw new Error("Please enter a valid email address.")
  }

  await validateMemberSignupEmail(normalized)

  const supabase = await createClient()
  const { error } = await supabase.auth.signInWithOtp({
    email: normalized,
    options: {
      emailRedirectTo: memberAuthRedirect(),
      shouldCreateUser: true,
      data: {
        signup_intent: "member",
        name: trimmedName,
      },
    },
  })

  if (error) throw new Error(error.message)
}

export async function signOutMember(): Promise<void> {
  const supabase = await createClient()
  const { error } = await supabase.auth.signOut()
  if (error) throw new Error(error.message)
  redirect("/")
}

export async function cancelMemberBooking(
  _prev: MemberCancelState,
  formData: FormData,
): Promise<MemberCancelState> {
  try {
    const bookingId = String(formData.get("bookingId") ?? "")
    if (!bookingId) {
      return { error: "Invalid booking." }
    }

    const { userId } = await requireMemberSession()
    await cancelBookingForUserRpc(bookingId, userId)

    revalidatePath("/account/bookings")
    revalidatePath("/")
    return {}
  } catch (error) {
    if (isRedirectError(error)) throw error
    const message =
      error instanceof Error ? error.message : "Could not cancel booking."
    return { error: message }
  }
}
