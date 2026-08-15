import { createServiceClient } from "@/lib/supabase/service"
import {
  discountFrom,
  money,
  paymentMode,
  type SessionPaymentMethod,
  quoteOrder,
  type Money,
  type OrderLine,
  type OrderQuote,
  type PaymentMode,
} from "@/lib/payments/money"
import { ratesForSession } from "@/lib/schedule/tiers"
import { SESSION_TIER_SELECT } from "@/lib/schedule/constants"
import type { SeatTier } from "@/lib/schedule/types"

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
  /** Per-tier line items and the order total, before any coupon. */
  priced: OrderQuote
  /** Final charge for the whole booking, including any accepted coupon. */
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

/**
 * Order lines in the shape the RPCs read.
 *
 * snake_case and a bare array because the database parses this with
 * jsonb_array_elements, not because anything here is trusted — every tier is
 * re-checked against the session inside the booking transaction.
 */
export function toRpcItems(lines: OrderLine[]) {
  return lines
    .filter((l) => l.adults + l.children > 0)
    .map((l) => ({
      tier_id: l.tierId,
      adults: l.adults,
      children: l.children,
    }))
}

const DEFAULT_LINE: OrderLine[] = [{ tierId: null, adults: 1, children: 0 }]

export async function quoteBooking(
  sessionId: string,
  couponCode?: string | null,
  email?: string | null,
  lines: OrderLine[] = DEFAULT_LINE,
): Promise<BookingQuote> {
  const supabase = createServiceClient()

  const { data: session, error } = await supabase
    .from("sessions")
    .select(
      `price_currency, price_amount, child_price_amount, payment_method,
       discount_type, discount_value, capacity, booked_count,
       tiers:session_tiers (${SESSION_TIER_SELECT})`,
    )
    .eq("id", sessionId)
    .maybeSingle()

  if (error) throw new Error(error.message)
  if (!session) throw new Error("Session not found.")

  const priced = quoteOrder(
    session.price_currency,
    discountFrom(session.discount_type, session.discount_value),
    ratesForSession({
      capacity: session.capacity,
      booked_count: session.booked_count,
      price_amount: session.price_amount,
      child_price_amount: session.child_price_amount,
      tiers: (session.tiers ?? []) as unknown as SeatTier[],
    }),
    lines,
  )

  // The class decides whether money is due now; the currency only decides who
  // could take it. Read once here so all three exits below agree.
  const method: SessionPaymentMethod =
    session.payment_method === "onsite" ? "onsite" : "online"

  const code = couponCode?.trim()
  if (!code) {
    return { priced, total: priced.total, mode: paymentMode(priced.total, method), coupon: null }
  }

  // No lock here: this is a preview. The booking transaction re-checks under
  // one, so a coupon that runs out between quote and submit is caught there.
  const { data, error: couponError } = await supabase.rpc("check_coupon", {
    p_code: code,
    p_session_id: sessionId,
    p_email: email ?? null,
    p_lock: false,
    p_items: toRpcItems(lines),
  })
  if (couponError) throw new Error(couponError.message)

  const row = Array.isArray(data) ? data[0] : data
  if (!row?.ok) {
    return {
      priced,
      total: priced.total,
      mode: paymentMode(priced.total, method),
      coupon: { applied: false, reason: (row?.reason ?? "not_found") as CouponReason },
    }
  }

  const total = money(priced.total.currency, row.final_amount)
  return {
    priced,
    total,
    mode: paymentMode(total, method),
    coupon: { applied: true, discountAmount: Number(row.discount_amount ?? 0) },
  }
}
