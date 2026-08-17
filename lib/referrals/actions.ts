"use server"

import { createClient } from "@/lib/supabase/server"
import { requireReferralEditor } from "@/lib/auth/require-viewer-session"
import { assertNotViewAs } from "@/lib/view-as-server"
import { asActionResult, UserFacingError, type ActionResult } from "@/lib/errors"
import { normalizeReferralCode } from "@/lib/referrals/cookie"
import { sessionPath } from "@/lib/referrals/links"
import { revalidateReferralScreens } from "@/lib/referrals/revalidate"

/**
 * Written through the request's own client so RLS decides who may write.
 * Admins and viewers both manage referrals (063); everyone else is refused by
 * the database, not by this file. The service client would bypass the check
 * worth keeping.
 *
 * Lives in lib/ rather than under a route: two screens call these now, /a and
 * /v, and neither owns them.
 */

export async function createReferrer(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  return asActionResult(
    "createReferrer",
    "레퍼럴을 만들지 못했습니다. 다시 시도해 주세요.",
    async () => {
      await requireReferralEditor()
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

      revalidateReferralScreens()
    },
  )
}

/**
 * A code built from a partner's slug.
 *
 * The slug is already the readable, url-safe name for that person, so reusing
 * it means the code on a printed card matches the address of their page — one
 * fewer thing to explain to the teacher holding it. Sanitised anyway, because
 * a slug is only guaranteed to be url-safe, and a code has a tighter shape
 * (referrers_code_format).
 */
function codeFromSlug(slug: string): string | null {
  const cleaned = slug
    .normalize("NFKD")
    .replace(/[^A-Za-z0-9_-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 32)
  return normalizeReferralCode(cleaned)
}

/**
 * Give a partner their own referral, the first time anyone asks.
 *
 * Not created up front for every partner: most never hand out a QR, and a
 * settlement list padded with codes nobody used is a list nobody reads.
 *
 * Idempotent. Two people pressing the button on the same teacher — one on the
 * partner screen, one on the referral screen — should end with one code, not
 * an error and a mystery.
 */
export async function createPartnerReferrer(
  partnerId: string,
): Promise<ActionResult> {
  return asActionResult(
    "createPartnerReferrer",
    "레퍼럴을 만들지 못했습니다. 다시 시도해 주세요.",
    async () => {
      await requireReferralEditor()
      await assertNotViewAs()

      const supabase = await createClient()

      const { data: partner } = await supabase
        .from("partners")
        .select("id, slug, name_ko, name_en")
        .eq("id", partnerId)
        .maybeSingle<{
          id: string
          slug: string
          name_ko: string | null
          name_en: string | null
        }>()

      if (!partner) throw new UserFacingError("파트너를 찾을 수 없습니다.")

      const { data: existing } = await supabase
        .from("referrers")
        .select("id")
        .eq("partner_id", partner.id)
        .maybeSingle<{ id: string }>()

      if (existing) {
        revalidateReferralScreens()
        return
      }

      const base = codeFromSlug(partner.slug)
      if (!base) {
        throw new UserFacingError(
          "이 파트너의 slug 로는 코드를 만들 수 없습니다. 바이럴 시드에서 직접 만들어 주세요.",
        )
      }

      // A slug clashing with a code someone typed by hand is rare but real —
      // "jin" the café and Jin the teacher. Suffix rather than refuse: the
      // person pressing this wants a QR, not a naming problem.
      const { data: taken } = await supabase
        .from("referrers")
        .select("code")
        .ilike("code", `${base}%`)

      const used = new Set((taken ?? []).map((r) => String(r.code).toLowerCase()))
      let code = base
      for (let n = 2; used.has(code.toLowerCase()) && n < 100; n++) {
        code = `${base.slice(0, 29)}-${n}`
      }

      const { error } = await supabase.from("referrers").insert({
        code,
        name: partner.name_ko || partner.name_en || partner.slug,
        partner_id: partner.id,
      })

      if (error) {
        // The unique index on partner_id. Someone else pressed it first, which
        // is the outcome this was for.
        if (error.code === "23505") {
          revalidateReferralScreens()
          return
        }
        throw new Error(error.message)
      }

      revalidateReferralScreens()
    },
  )
}

/**
 * Put one referrer on one class: the link and QR they will post.
 *
 * One class can carry many referrers, and the same referrer can carry many
 * classes — which is why this is a row rather than a column on either side.
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
      await requireReferralEditor()
      await assertNotViewAs()

      const referrerId = String(formData.get("referrerId") ?? "").trim()
      const sessionId = String(formData.get("sessionId") ?? "").trim()
      const label = String(formData.get("label") ?? "").trim()

      if (!sessionId) throw new UserFacingError("수업을 찾을 수 없습니다.")
      if (!referrerId) throw new UserFacingError("레퍼럴 대상을 골라 주세요.")

      const supabase = await createClient()

      // The class has to be one we can actually find. A link to a class that
      // does not exist is a QR that 404s, and it would be discovered by the
      // person holding the flyer.
      const { data: session } = await supabase
        .from("sessions")
        .select("id")
        .eq("id", sessionId)
        .maybeSingle<{ id: string }>()

      if (!session) throw new UserFacingError("수업을 찾을 수 없습니다.")

      const { error } = await supabase.from("referral_links").insert({
        referrer_id: referrerId,
        session_id: session.id,
        path: sessionPath(session.id),
        label,
      })

      if (error) {
        // The unique index on (referrer_id, path). The same person twice on
        // the same class is a slip, and two rows for it means two answers to
        // what we handed out.
        if (error.code === "23505") {
          throw new UserFacingError("이 수업에 이미 등록된 레퍼럴입니다.")
        }
        throw new Error(error.message)
      }

      revalidateReferralScreens()
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
    await requireReferralEditor()
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

    revalidateReferralScreens()
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
      await requireReferralEditor()
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

      revalidateReferralScreens()
    },
  )
}
