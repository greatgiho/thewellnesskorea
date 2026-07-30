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
      "이미 가입된 파트너 계정입니다. 로그인해 주세요.",
    )
  }
  throw new UserFacingError(
    "이 이메일은 이미 다른 계정으로 사용 중입니다.",
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
    throw new UserFacingError("등록된 파트너 계정을 찾을 수 없습니다.")
  }

  const role = (existing.app_metadata as Record<string, unknown> | undefined)
    ?.role
  if (role !== "partner") {
    throw new UserFacingError(
      "파트너 계정이 아닙니다. 관리자에게 문의해 주세요.",
    )
  }

  const { data: partner } = await createServiceClient()
    .from("partners")
    .select("registration_status, email")
    .eq("user_id", existing.id)
    .maybeSingle()

  if (!partner) {
    throw new UserFacingError(
      "연결된 파트너 프로필이 없습니다. 관리자에게 문의해 주세요.",
    )
  }

  if (
    !canAccessPartnerPortal(
      partner.registration_status as PartnerRegistrationStatus,
    )
  ) {
    throw new UserFacingError(
      "아직 승인 대기 중인 계정입니다. 승인 후 로그인할 수 있습니다.",
    )
  }

  const contact = typeof partner.email === "string" ? partner.email.trim() : ""
  if (!contact) {
    throw new UserFacingError(
      "파트너 연락 이메일이 설정돼 있지 않습니다. 관리자에게 문의해 주세요.",
    )
  }

  return contact
}
