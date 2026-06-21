import { UserFacingError } from "@/lib/errors"
import {
  findAuthUserByEmail,
  isAdminAuthUser,
} from "@/lib/auth/teacher-email"

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase()
}

export function isMemberAuthUser(
  appMetadata: Record<string, unknown> | undefined,
): boolean {
  return appMetadata?.role === "member"
}

/**
 * Member signup/login must not use admin or teacher Auth accounts.
 */
export async function assertMemberEmailAvailable(email: string): Promise<void> {
  const normalized = normalizeEmail(email)
  if (!normalized) return

  const existing = await findAuthUserByEmail(normalized)
  if (!existing) return

  const appMeta = existing.app_metadata as Record<string, unknown> | undefined
  const role = appMeta?.role

  if (role === "teacher") {
    throw new UserFacingError(
      "This email is registered as a teacher account. Please use the teacher login.",
    )
  }

  if (role === "member") return

  if (isAdminAuthUser(appMeta)) {
    throw new UserFacingError(
      "This email is registered as an admin account and cannot be used for member sign-in.",
    )
  }

  throw new UserFacingError(
    "This email is already registered. Sign in or use a different address.",
  )
}

export { normalizeEmail as normalizeMemberEmail }
