import { createServiceClient } from "@/lib/supabase/service"
import { UserFacingError } from "@/lib/errors"

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase()
}

export function isMemberAuthUser(
  appMetadata: Record<string, unknown> | undefined,
): boolean {
  return appMetadata?.role === "member"
}

export function isAdminAuthUser(
  appMetadata: Record<string, unknown> | undefined,
): boolean {
  return appMetadata?.role === "admin"
}

async function findAuthUserByEmail(email: string) {
  const supabase = createServiceClient()
  const { data, error } = await supabase.auth.admin.listUsers()
  if (error) return null
  return data.users.find((u) => u.email === email) ?? null
}

/**
 * Member signup/login must not use admin Auth accounts.
 */
export async function assertMemberEmailAvailable(email: string): Promise<void> {
  const normalized = normalizeEmail(email)
  if (!normalized) return

  const existing = await findAuthUserByEmail(normalized)
  if (!existing) return

  const appMeta = existing.app_metadata as Record<string, unknown> | undefined

  if (isMemberAuthUser(appMeta)) return

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
