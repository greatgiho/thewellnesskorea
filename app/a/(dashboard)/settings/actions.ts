"use server"

import { createClient as createPlainClient } from "@supabase/supabase-js"
import { createClient } from "@/lib/supabase/server"
import { requireAdminSession } from "@/lib/auth/require-session"
import { assertNotViewAs } from "@/lib/view-as-server"
import { asActionResult, UserFacingError, type ActionResult } from "@/lib/errors"
import { MIN_PASSWORD_LENGTH } from "@/lib/auth/password"
import { pickEditableColumns } from "@/lib/site/settings"

/**
 * Check a password by signing in with it, without disturbing the session.
 *
 * Supabase's updateUser({ password }) does not ask for the old one, so on its
 * own it lets anyone who finds an unattended open session lock the owner out of
 * their own account. Confirming the current password first is the whole point
 * of asking for it.
 *
 * A throwaway client rather than the request's own: signInWithPassword on the
 * cookie-bound client would rewrite the session cookies as a side effect of a
 * check. This one persists nothing.
 */
async function currentPasswordIsCorrect(
  email: string,
  password: string,
): Promise<boolean> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !anonKey) throw new Error("Supabase env is not configured.")

  const probe = createPlainClient(url, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
  const { error } = await probe.auth.signInWithPassword({ email, password })
  return !error
}

export async function changeAdminPassword(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  return asActionResult(
    "changeAdminPassword",
    "Could not change the password. Please try again.",
    async () => {
      const { user } = await requireAdminSession()
      // An admin looking through someone else's portal is still themselves, but
      // view-as is read-only everywhere else and a password change is the last
      // write that should make an exception.
      await assertNotViewAs()

      const currentPassword = String(formData.get("currentPassword") ?? "")
      const newPassword = String(formData.get("newPassword") ?? "")
      const confirmPassword = String(formData.get("confirmPassword") ?? "")

      if (!currentPassword || !newPassword) {
        throw new UserFacingError("현재 비밀번호와 새 비밀번호를 모두 입력해 주세요.")
      }
      if (newPassword !== confirmPassword) {
        throw new UserFacingError("새 비밀번호가 서로 다릅니다.")
      }
      if (newPassword.length < MIN_PASSWORD_LENGTH) {
        throw new UserFacingError(
          `새 비밀번호는 ${MIN_PASSWORD_LENGTH}자 이상이어야 합니다.`,
        )
      }
      if (newPassword === currentPassword) {
        throw new UserFacingError("지금 쓰고 있는 비밀번호와 같습니다.")
      }
      if (!user.email) {
        throw new UserFacingError(
          "이 계정에는 이메일 주소가 없어 비밀번호를 바꿀 수 없습니다.",
        )
      }

      if (!(await currentPasswordIsCorrect(user.email, currentPassword))) {
        throw new UserFacingError("현재 비밀번호가 맞지 않습니다.")
      }

      const supabase = await createClient()
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      })
      if (error) throw new Error(error.message)
    },
  )
}

/**
 * Save the business/representative details the public footer prints.
 *
 * Written through the request's own client, so RLS decides: site_settings
 * grants UPDATE to admins only, and the row can be neither inserted nor
 * deleted. The service client would bypass exactly the check worth keeping.
 */
export async function saveSiteSettings(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  return asActionResult(
    "saveSiteSettings",
    "설정을 저장하지 못했습니다. 다시 시도해 주세요.",
    async () => {
      await requireAdminSession()
      await assertNotViewAs()

      const patch = pickEditableColumns(formData)

      // Every field is optional — a legal notice half-entered is still worth
      // showing, and refusing a partly-filled save would only lose the part
      // that is filled. An empty submission, though, is a bug somewhere else.
      if (Object.keys(patch).length === 0) {
        throw new UserFacingError("저장할 항목이 없습니다.")
      }

      const supabase = await createClient()
      const { data, error } = await supabase
        .from("site_settings")
        .update(patch)
        .eq("id", true)
        .select("id")

      if (error) throw new Error(error.message)
      // RLS refusing an update is not an error to PostgREST — it is zero rows
      // touched. Without this, a non-admin (or a missing row) would be told the
      // save worked and see the old values come back on reload.
      if (!data || data.length === 0) {
        throw new UserFacingError(
          "저장할 권한이 없거나 설정 행이 없습니다.",
        )
      }
    },
  )
}
