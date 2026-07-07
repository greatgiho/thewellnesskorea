import { createServiceClient } from "@/lib/supabase/service"
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
      "이미 가입된 파트너 계정입니다. 로그인해 주세요.",
    )
  }
  throw new UserFacingError(
    "이 이메일은 이미 다른 계정으로 사용 중입니다.",
  )
}
