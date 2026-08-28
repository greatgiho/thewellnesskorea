"use server"

import { revalidatePath } from "next/cache"
import { requireAdminSession } from "@/lib/auth/require-session"
import { normalizeCouponCode } from "@/lib/coupons/link"
import type { SessionCouponInput } from "@/lib/schedule/types"

/**
 * The one discount code that belongs to a class.
 *
 * Coupons already have a home at /a/coupons, and that screen still owns the
 * general case — dated windows, usage caps, codes good across an experience.
 * What it could not answer was the question people actually have while setting
 * a price: "and what's the code for this class?" That meant leaving the
 * session, opening another screen, remembering the class name, and coming
 * back — which is why nobody made one.
 *
 * So a session may have exactly one code attached from its own pricing panel.
 * One, not a list: a class with three codes is a pricing scheme, and a pricing
 * scheme belongs on the screen built for it. Anything with a date window or a
 * redemption cap still goes through /a/coupons, and a coupon created here can
 * be opened there afterwards to gain either.
 *
 * Since 070 this stacks with the class's own discount rather than competing
 * with it, which is what makes a per-class code worth having: the class can go
 * on sale without silently killing every code already handed out.
 */

export type SessionCouponResult = { ok: true } | { ok: false; error: string }

/** The code attached to this class, or null. */
export async function getSessionCoupon(
  sessionId: string,
): Promise<SessionCouponInput | null> {
  const { supabase } = await requireAdminSession()

  const { data, error } = await supabase
    .from("coupons")
    .select("code, discount_type, discount_value")
    .eq("session_id", sessionId)
    // A class can only be given one from here, but /a/coupons could have
    // scoped a second one to it. Oldest wins, so the answer does not change
    // shape depending on when it is asked.
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle()

  if (error || !data) return null

  return {
    code: data.code,
    discount_type: data.discount_type as "fixed" | "percent",
    discount_value: Number(data.discount_value ?? 0),
  }
}

function validate(input: SessionCouponInput, currency: string): string | null {
  const code = normalizeCouponCode(input.code)
  if (!code) return "코드를 입력하세요."
  if (!/^[A-Z0-9_-]+$/.test(code)) {
    return "코드에는 영문·숫자·하이픈·밑줄만 쓸 수 있습니다."
  }
  if (!(input.discount_value > 0)) return "할인 값은 0보다 커야 합니다."
  if (input.discount_type === "percent" && input.discount_value > 100) {
    return "정률 할인은 100%를 넘을 수 없습니다."
  }
  if (input.discount_type === "fixed" && !currency) {
    return "정액 할인에는 통화가 필요합니다."
  }
  return null
}

/**
 * Attach, change, or remove the class's code.
 *
 * Passing null removes it. Deleted rather than deactivated: a code made here
 * has no redemption history worth keeping if it was never given out, and one
 * that was given out and then cleared should stop working — leaving an
 * inactive row behind would mean the code cannot be reused for the class
 * later, since the unique index does not care whether a coupon is active.
 *
 * A fixed discount is stored against the class's currency, because that is
 * the only currency it can ever be spent in.
 */
export async function saveSessionCoupon(
  sessionId: string,
  input: SessionCouponInput | null,
  currency: string,
): Promise<SessionCouponResult> {
  const { supabase } = await requireAdminSession()

  const { data: existing } = await supabase
    .from("coupons")
    .select("id")
    .eq("session_id", sessionId)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle()

  if (!input || !input.code.trim()) {
    if (existing?.id) {
      const { error } = await supabase.from("coupons").delete().eq("id", existing.id)
      if (error) return { ok: false, error: error.message }
    }
    revalidatePath("/a/coupons")
    revalidatePath(`/book/${sessionId}`)
    return { ok: true }
  }

  const problem = validate(input, currency)
  if (problem) return { ok: false, error: problem }

  const row = {
    code: normalizeCouponCode(input.code),
    discount_type: input.discount_type,
    discount_value: input.discount_value,
    currency: input.discount_type === "fixed" ? currency : null,
    session_id: sessionId,
    is_active: true,
  }

  const { error } = existing?.id
    ? await supabase.from("coupons").update(row).eq("id", existing.id)
    : await supabase.from("coupons").insert(row)

  if (error) {
    // The unique index is on upper(btrim(code)), so a clash means the code is
    // already in use — possibly by another class, which is exactly the case
    // where a vague error would send somebody hunting.
    if (error.code === "23505") {
      return { ok: false, error: "이미 쓰이고 있는 코드입니다." }
    }
    return { ok: false, error: error.message }
  }

  revalidatePath("/a/coupons")
  revalidatePath(`/book/${sessionId}`)
  return { ok: true }
}

/**
 * Codes that already work on this class but are not its own.
 *
 * The panel above asks for a code "for this class", and when there is none it
 * says so — which reads as "this class has no discount code", even when a
 * site-wide code is live and working on it right now. The person setting the
 * price then makes a second code nobody needed, or worse, believes the one
 * they made yesterday is gone.
 *
 * Read-only here. These belong to other scopes and are edited where they were
 * created; showing them is about answering "is there already one?", not about
 * moving their home.
 */
export type ApplicableCoupon = {
  id: string
  code: string
  discountType: "fixed" | "percent"
  discountValue: number
  /** A fixed coupon's own currency; null for a percentage. */
  currency: string | null
  /** Whether it covers every class or one experience. */
  scope: "all" | "experience"
  startsAt: string | null
  endsAt: string | null
  isActive: boolean
}

export async function getApplicableCoupons(
  experienceId: string | null,
): Promise<ApplicableCoupon[]> {
  const { supabase } = await requireAdminSession()

  let query = supabase
    .from("coupons")
    .select("id, code, discount_type, discount_value, currency, experience_id, starts_at, ends_at, is_active")
    // Session-scoped rows are the panel's own field, or another class's — a
    // coupon tied to a different session does not apply here at all.
    .is("session_id", null)

  query = experienceId
    ? query.or(`experience_id.is.null,experience_id.eq.${experienceId}`)
    : query.is("experience_id", null)

  const { data, error } = await query.order("code")
  if (error || !data) return []

  return data.map((row) => ({
    id: row.id as string,
    code: row.code as string,
    discountType: row.discount_type as "fixed" | "percent",
    discountValue: Number(row.discount_value ?? 0),
    currency: (row.currency as string | null) ?? null,
    scope: row.experience_id ? ("experience" as const) : ("all" as const),
    startsAt: (row.starts_at as string | null) ?? null,
    endsAt: (row.ends_at as string | null) ?? null,
    isActive: Boolean(row.is_active),
  }))
}
