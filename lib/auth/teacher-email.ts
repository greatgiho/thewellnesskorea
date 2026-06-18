import type { User } from "@supabase/supabase-js"
import { UserFacingError } from "@/lib/errors"
import { createServiceClient } from "@/lib/supabase/service"

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase()
}

export function isAdminAuthUser(
  appMetadata: Record<string, unknown> | undefined,
): boolean {
  const role = appMetadata?.role
  return role !== "teacher"
}

export async function findAuthUserByEmail(email: string): Promise<User | null> {
  const admin = createServiceClient()
  const normalized = normalizeEmail(email)
  let page = 1

  while (true) {
    const { data, error } = await admin.auth.admin.listUsers({
      page,
      perPage: 200,
    })
    if (error) throw new Error(error.message)

    const match = data.users.find(
      (u) => u.email?.toLowerCase() === normalized,
    )
    if (match) return match

    if (data.users.length < 200) break
    page += 1
  }

  return null
}

/**
 * Option A (Strict): teacher `people.email` must not collide with admin Auth
 * or another teacher's Auth account.
 */
export async function assertTeacherEmailAvailable(
  email: string,
  options?: { excludeUserId?: string | null },
): Promise<void> {
  const normalized = normalizeEmail(email)
  if (!normalized) return

  const existing = await findAuthUserByEmail(normalized)
  if (!existing) return

  const excludeUserId = options?.excludeUserId ?? null
  if (excludeUserId && existing.id === excludeUserId) return

  if (isAdminAuthUser(existing.app_metadata as Record<string, unknown>)) {
    throw new UserFacingError(
      "이 이메일은 어드민 계정에서 사용 중입니다. 선생님 연락처에는 다른 이메일을 사용하세요.",
    )
  }

  throw new UserFacingError(
    "이 이메일은 다른 선생님 계정에 연결되어 있습니다.",
  )
}

export async function syncTeacherAuthEmail(
  userId: string,
  email: string,
): Promise<void> {
  const normalized = normalizeEmail(email)
  if (!normalized) return

  const admin = createServiceClient()
  const { error } = await admin.auth.admin.updateUserById(userId, {
    email: normalized,
    email_confirm: true,
  })
  if (error) throw new Error(error.message)
}

export async function resolveEmailChangeOnAdminSave(params: {
  previousUserId: string
  previousEmail: string
  newEmail: string
}): Promise<void> {
  const previous = normalizeEmail(params.previousEmail)
  const next = normalizeEmail(params.newEmail)

  if (!next || next === previous) return

  await assertTeacherEmailAvailable(next, {
    excludeUserId: params.previousUserId,
  })
  await syncTeacherAuthEmail(params.previousUserId, next)
}
