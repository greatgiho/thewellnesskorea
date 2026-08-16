"use server"

import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase/server"
import { requireAdminSession } from "@/lib/auth/require-session"
import { assertNotViewAs } from "@/lib/view-as-server"
import { asActionResult, UserFacingError, type ActionResult } from "@/lib/errors"
import { normalizeReferralCode } from "@/lib/referrals/cookie"

/**
 * Written through the request's own client so RLS decides: referrers grants
 * everything to admins and read-only to everyone else. The service client
 * would bypass the check worth keeping.
 */

export async function createReferrer(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  return asActionResult(
    "createReferrer",
    "레퍼럴을 만들지 못했습니다. 다시 시도해 주세요.",
    async () => {
      await requireAdminSession()
      await assertNotViewAs()

      const code = normalizeReferralCode(String(formData.get("code") ?? ""))
      const name = String(formData.get("name") ?? "").trim()
      const note = String(formData.get("note") ?? "").trim()

      if (!code) {
        throw new UserFacingError(
          "코드는 영문·숫자·하이픈·밑줄 2~32자여야 합니다.",
        )
      }
      if (!name) throw new UserFacingError("이름을 입력해 주세요.")

      const supabase = await createClient()
      const { error } = await supabase
        .from("referrers")
        .insert({ code, name, note })

      // 23505 is the unique index on lower(code). Worth naming, because the
      // clash is usually the same partner being added twice with different
      // capitals, and "already exists" is the only useful thing to say.
      if (error) {
        if (error.code === "23505") {
          throw new UserFacingError(`이미 있는 코드입니다: ${code}`)
        }
        throw new Error(error.message)
      }

      revalidatePath("/a/referrals")
    },
  )
}

export async function setReferrerActive(
  id: string,
  isActive: boolean,
): Promise<ActionResult> {
  return asActionResult(
    "setReferrerActive",
    "상태를 바꾸지 못했습니다.",
    async () => {
      await requireAdminSession()
      await assertNotViewAs()

      const supabase = await createClient()
      // Deactivating, never deleting. Bookings keep the code as text, so a
      // removed row would leave past statements pointing at a name nobody can
      // look up — and the whole reason this table exists is to be able to
      // explain a payment months later.
      const { data, error } = await supabase
        .from("referrers")
        .update({ is_active: isActive })
        .eq("id", id)
        .select("id")

      if (error) throw new Error(error.message)
      if (!data || data.length === 0) {
        throw new UserFacingError("권한이 없거나 대상을 찾을 수 없습니다.")
      }

      revalidatePath("/a/referrals")
    },
  )
}
