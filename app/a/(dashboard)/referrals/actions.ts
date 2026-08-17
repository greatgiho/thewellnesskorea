"use server"

import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase/server"
import { requireAdminSession } from "@/lib/auth/require-session"
import { assertNotViewAs } from "@/lib/view-as-server"
import { asActionResult, UserFacingError, type ActionResult } from "@/lib/errors"
import { normalizeReferralCode } from "@/lib/referrals/cookie"
import { sessionPath } from "@/lib/referrals/links"

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

/**
 * Save a link target for a partner: a class, or the front page.
 *
 * The path is built here from a picked session id, never taken from the form,
 * so nothing typed into a browser decides where a printed QR sends people.
 */
export async function createReferralLink(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  return asActionResult(
    "createReferralLink",
    "링크를 만들지 못했습니다. 다시 시도해 주세요.",
    async () => {
      await requireAdminSession()
      await assertNotViewAs()

      const referrerId = String(formData.get("referrerId") ?? "").trim()
      const sessionId = String(formData.get("sessionId") ?? "").trim()
      const label = String(formData.get("label") ?? "").trim()

      if (!referrerId) throw new UserFacingError("레퍼럴을 찾을 수 없습니다.")

      const supabase = await createClient()

      // "" means the front page. Anything else has to be a session we can
      // actually find: a link to a class that does not exist is a QR that
      // 404s, and it would be discovered by the person holding the flyer.
      let path = "/"
      if (sessionId) {
        const { data: session } = await supabase
          .from("sessions")
          .select("id")
          .eq("id", sessionId)
          .maybeSingle<{ id: string }>()

        if (!session) throw new UserFacingError("수업을 찾을 수 없습니다.")
        path = sessionPath(session.id)
      }

      const { error } = await supabase.from("referral_links").insert({
        referrer_id: referrerId,
        session_id: sessionId || null,
        path,
        label,
      })

      if (error) {
        // The unique index on (referrer_id, path). Making the same QR twice is
        // a slip, and two rows for it means two answers to what we handed out.
        if (error.code === "23505") {
          throw new UserFacingError("이미 같은 대상의 링크가 있습니다.")
        }
        throw new Error(error.message)
      }

      revalidatePath("/a/referrals")
    },
  )
}

/**
 * Remove a saved link.
 *
 * Deleting is fine here, unlike a referrer: attribution lives on the booking as
 * a code, so nothing in a past statement depends on this row. It is a note of
 * what we printed, and a note can be wrong.
 */
export async function deleteReferralLink(id: string): Promise<ActionResult> {
  return asActionResult("deleteReferralLink", "링크를 지우지 못했습니다.", async () => {
    await requireAdminSession()
    await assertNotViewAs()

    const supabase = await createClient()
    const { data, error } = await supabase
      .from("referral_links")
      .delete()
      .eq("id", id)
      .select("id")

    if (error) throw new Error(error.message)
    if (!data || data.length === 0) {
      throw new UserFacingError("권한이 없거나 대상을 찾을 수 없습니다.")
    }

    revalidatePath("/a/referrals")
  })
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
