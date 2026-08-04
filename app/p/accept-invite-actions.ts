"use server"

import { createHash } from "crypto"
import { createServiceClient } from "@/lib/supabase/service"
import { isUserFacingError } from "@/lib/errors"

export type AcceptInviteResult = { ok: true } | { ok: false; error: string }

/**
 * Partner redeems an emailed invite token and sets their own password.
 * The token validation + single-use clear happens in the accept_partner_invite
 * RPC; the password is then set on the linked auth user via the admin API.
 */
export async function acceptPartnerInvite(input: {
  token: string
  password: string
}): Promise<AcceptInviteResult> {
  try {
    const token = input.token?.trim()
    if (!token) throw new Error("This invite link is not valid.")
    if (input.password.length < 8)
      throw new Error("Password must be at least 8 characters.")

    const service = createServiceClient()
    const tokenHash = createHash("sha256").update(token).digest("hex")

    const { data: userId, error: rpcError } = await service.rpc(
      "accept_partner_invite",
      { p_token_hash: tokenHash },
    )
    if (rpcError) {
      if (rpcError.message?.includes("invalid_or_expired")) {
        throw new Error("This invite link has expired or was already used.")
      }
      if (rpcError.message?.includes("not_linked")) {
        throw new Error(
          "There is a problem with this account link. Please contact an administrator.",
        )
      }
      throw new Error(rpcError.message)
    }

    const { error: pwError } = await service.auth.admin.updateUserById(
      userId as string,
      { password: input.password },
    )
    if (pwError) throw new Error(pwError.message)

    return { ok: true }
  } catch (error) {
    return {
      ok: false,
      error:
        isUserFacingError(error) || error instanceof Error
          ? (error as Error).message
          : "Failed to set your password. Please try again in a moment.",
    }
  }
}
