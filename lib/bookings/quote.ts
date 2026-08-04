import { createServiceClient } from "@/lib/supabase/service"
import {
  applyDiscount,
  discountFrom,
  money,
  paymentMode,
  type Money,
  type PaymentMode,
  type PricedMoney,
} from "@/lib/payments/money"

/**
 * What a booking will actually cost, coupon included.
 *
 * The booking RPCs recompute this inside their transaction — the client is
 * never trusted with a price. This exists so the form can show the customer
 * the same number beforehand, and so the action can tell whether the booking
 * still needs the online payment step after discounts.
 *
 * check_coupon reports a machine-readable reason instead of raising, so a bad
 * code is a message on the form rather than a failed booking.
 */

export type CouponReason =
  | "not_found"
  | "inactive"
  | "not_started"
  | "expired"
  | "not_applicable"
  | "currency_mismatch"
  | "limit_reached"
  | "user_limit_reached"
  | "not_better"
  | "session_not_found"

export type BookingQuote = {
  /** List price and the price after the session's own discount. */
  priced: PricedMoney
  /** Final charge including any accepted coupon. */
  total: Money
  mode: PaymentMode
  coupon:
    | { applied: true; discountAmount: number }
    | { applied: false; reason: CouponReason }
    | null
}

const COUPON_MESSAGES: Record<CouponReason, string> = {
  not_found: "That code doesn't exist.",
  inactive: "This code can't be used.",
  not_started: "This code isn't active yet.",
  expired: "This code has expired.",
  not_applicable: "This code can't be used for this session.",
  currency_mismatch: "This code can't be used with this session's payment currency.",
  limit_reached: "This code has reached its usage limit.",
  user_limit_reached: "You've already used this code.",
  not_better: "The discount already applied is a better deal.",
  session_not_found: "Session not found.",
}

export function couponMessage(reason: CouponReason): string {
  return COUPON_MESSAGES[reason] ?? "This code can't be used."
}

export async function quoteBooking(
  sessionId: string,
  couponCode?: string | null,
  email?: string | null,
): Promise<BookingQuote> {
  const supabase = createServiceClient()

  const { data: session, error } = await supabase
    .from("sessions")
    .select("price_currency, price_amount, discount_type, discount_value")
    .eq("id", sessionId)
    .maybeSingle()

  if (error) throw new Error(error.message)
  if (!session) throw new Error("Session not found.")

  const priced = applyDiscount(
    money(session.price_currency, session.price_amount),
    discountFrom(session.discount_type, session.discount_value),
  )

  const code = couponCode?.trim()
  if (!code) {
    return { priced, total: priced.final, mode: paymentMode(priced.final), coupon: null }
  }

  // No lock here: this is a preview. The booking transaction re-checks under
  // one, so a coupon that runs out between quote and submit is caught there.
  const { data, error: couponError } = await supabase.rpc("check_coupon", {
    p_code: code,
    p_session_id: sessionId,
    p_email: email ?? null,
    p_lock: false,
  })
  if (couponError) throw new Error(couponError.message)

  const row = Array.isArray(data) ? data[0] : data
  if (!row?.ok) {
    return {
      priced,
      total: priced.final,
      mode: paymentMode(priced.final),
      coupon: { applied: false, reason: (row?.reason ?? "not_found") as CouponReason },
    }
  }

  const total = money(priced.final.currency, row.final_amount)
  return {
    priced,
    total,
    mode: paymentMode(total),
    coupon: { applied: true, discountAmount: Number(row.discount_amount ?? 0) },
  }
}
