import { createServiceClient } from "@/lib/supabase/service"
import { canAccessPartnerPortal } from "@/lib/partners/registration-status"
import type { PartnerRegistrationStatus } from "@/lib/partners/types"
import { UserFacingError } from "@/lib/errors"

function normalize(email: string): string {
  return email.trim().toLowerCase()
}

async function findAuthUserByEmail(email: string) {
  const supabase = createServiceClient()
  const { data, error } = await supabase.auth.admin.listUsers()
  if (error) return null
  return data.users.find((u) => u.email === email) ?? null
}

/**
 * Partner self-signup: the email must not already have an Auth account.
 * - existing partner account -> tell them to log in
 * - any other existing account (member/admin) -> email taken
 * If no Auth account exists, the caller may create one (and optionally link an
 * admin-precreated partners row by email).
 */
export async function assertPartnerSignupEmailAvailable(
  email: string,
): Promise<void> {
  const existing = await findAuthUserByEmail(normalize(email))
  if (!existing) return

  const role = (existing.app_metadata as Record<string, unknown> | undefined)
    ?.role
  if (role === "partner") {
    throw new UserFacingError(
      "This email already has a partner account. Please sign in.",
    )
  }
  throw new UserFacingError(
    "This email is already used by another account.",
  )
}

/**
 * Partner sign-in (magic link): validate that the email belongs to an existing,
 * approved partner account (never create an account, never let a member/admin
 * email into the portal — 1 email = 1 role) and return the address the link
 * should be delivered to: the partner's contact email (partners.email). That
 * field is the single source of the delivery address, so test accounts whose
 * login email is undeliverable just carry a real (or Gmail "+alias") address
 * there — no special-casing in code.
 */
export async function resolvePartnerLoginDeliveryEmail(
  email: string,
): Promise<string> {
  const existing = await findAuthUserByEmail(normalize(email))
  if (!existing) {
    throw new UserFacingError("No partner account found for this email.")
  }

  const role = (existing.app_metadata as Record<string, unknown> | undefined)
    ?.role
  if (role !== "partner") {
    throw new UserFacingError(
      "This is not a partner account. Please contact an administrator.",
    )
  }

  const { data: partner } = await createServiceClient()
    .from("partners")
    .select("registration_status, email")
    .eq("user_id", existing.id)
    .maybeSingle()

  if (!partner) {
    throw new UserFacingError(
      "No partner profile is linked to this account. Please contact an administrator.",
    )
  }

  if (
    !canAccessPartnerPortal(
      partner.registration_status as PartnerRegistrationStatus,
    )
  ) {
    throw new UserFacingError(
      "This account is still awaiting approval. You can sign in once it is approved.",
    )
  }

  const contact = typeof partner.email === "string" ? partner.email.trim() : ""
  if (!contact) {
    throw new UserFacingError(
      "This partner has no contact email set. Please contact an administrator.",
    )
  }

  return contact
}
