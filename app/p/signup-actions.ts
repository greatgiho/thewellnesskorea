"use server"

import { createServiceClient } from "@/lib/supabase/service"
import { assertPartnerSignupEmailAvailable } from "@/lib/auth/partner-email"
import { isUserFacingError } from "@/lib/errors"
import type { PartnerKind } from "@/lib/partners/types"

export type PartnerSignupInput = {
  email: string
  password: string
  nameKo: string
  nameEn: string
  kind: PartnerKind
  roleKo: string
  roleEn: string
}

export type PartnerSignupResult =
  | { ok: true; pending: boolean }
  | { ok: false; error: string }

/**
 * Partner self-registration.
 * - If an admin-precreated partners row matches the email (no linked account
 *   yet), link the new auth account to it (kept at its existing status).
 * - Otherwise create a new partners row with registration_status = "submitted"
 *   (pending admin approval; blocked from the portal by the approval gate).
 */
export async function signUpPartner(
  input: PartnerSignupInput,
): Promise<PartnerSignupResult> {
  try {
    const email = input.email.trim().toLowerCase()
    if (!/.+@.+\..+/.test(email))
      throw new Error("Please enter a valid email address.")
    if (input.password.length < 8)
      throw new Error("Password must be at least 8 characters.")
    if (!input.nameKo.trim() || !input.nameEn.trim())
      throw new Error("Enter your name in both Korean and English.")

    await assertPartnerSignupEmailAvailable(email)

    const service = createServiceClient()

    // Create the login account (partner sets their own password).
    const { data: created, error: cErr } = await service.auth.admin.createUser({
      email,
      password: input.password,
      email_confirm: true,
      app_metadata: { role: "partner" },
      user_metadata: { name: input.nameKo.trim() },
    })
    if (cErr) throw new Error(cErr.message)
    const userId = created.user.id

    // Insert/link the partners row via SECURITY DEFINER RPC (service_role has no
    // direct DML grant on partners). Returns the resulting registration_status.
    const { data: status, error: rpcErr } = await service.rpc("signup_partner", {
      p_user_id: userId,
      p_email: email,
      p_name_ko: input.nameKo,
      p_name_en: input.nameEn,
      p_kind: input.kind,
      p_role_ko: input.roleKo,
      p_role_en: input.roleEn,
    })

    if (rpcErr) {
      // Roll back the orphan auth account on any failure.
      await service.auth.admin.deleteUser(userId)
      if (rpcErr.message?.includes("already_registered")) {
        throw new Error("This email is already registered. Please sign in.")
      }
      throw new Error(rpcErr.message)
    }

    const pending = status !== "admin" && status !== "approved"
    return { ok: true, pending }
  } catch (error) {
    return {
      ok: false,
      error:
        isUserFacingError(error) || error instanceof Error
          ? (error as Error).message
          : "Sign-up failed. Please try again in a moment.",
    }
  }
}
