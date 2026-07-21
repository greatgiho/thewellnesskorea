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
    if (!token) throw new Error("잘못된 초대 링크입니다.")
    if (input.password.length < 8)
      throw new Error("비밀번호는 8자 이상이어야 합니다.")

    const service = createServiceClient()
    const tokenHash = createHash("sha256").update(token).digest("hex")

    const { data: userId, error: rpcError } = await service.rpc(
      "accept_partner_invite",
      { p_token_hash: tokenHash },
    )
    if (rpcError) {
      if (rpcError.message?.includes("invalid_or_expired")) {
        throw new Error("만료되었거나 이미 사용된 초대 링크입니다.")
      }
      if (rpcError.message?.includes("not_linked")) {
        throw new Error("계정 연결에 문제가 있습니다. 관리자에게 문의해 주세요.")
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
          : "비밀번호 설정에 실패했습니다. 잠시 후 다시 시도해 주세요.",
    }
  }
}
