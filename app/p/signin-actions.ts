"use server"

import { siteOrigin } from "@/lib/site-origin"
import { assertPartnerLoginEmailAllowed } from "@/lib/auth/partner-email"
import { isValidEmail } from "@/lib/partners/utils"
import { createClient } from "@/lib/supabase/server"

/**
 * Send a partner sign-in magic link. The email must already belong to an
 * approved partner account (guarded); we never create a new account here.
 * The link lands on /auth/callback and redirects into the partner portal.
 */
export async function requestPartnerLoginLink(email: string): Promise<void> {
  const normalized = email.trim().toLowerCase()
  if (!isValidEmail(normalized)) {
    throw new Error("Please enter a valid email address.")
  }

  await assertPartnerLoginEmailAllowed(normalized)

  const params = new URLSearchParams({ next: "/p" })
  const supabase = await createClient()
  const { error } = await supabase.auth.signInWithOtp({
    email: normalized,
    options: {
      emailRedirectTo: `${siteOrigin()}/auth/callback?${params.toString()}`,
      shouldCreateUser: false,
    },
  })

  if (error) throw new Error(error.message)
}
