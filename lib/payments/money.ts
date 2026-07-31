import type { Currency } from "@/lib/schedule/types"

/**
 * A price/charge as a single value: currency + amount. Bundling the pair keeps
 * formatting, the PayPal amount string, and numeric-as-string coercion in one
 * place instead of scattered across queries and components.
 */
export type Money = { currency: Currency; amount: number }

/** Build a Money from raw DB/form values (coerces PostgREST numeric strings). */
export function money(
  currency: string | null | undefined,
  amount: number | string | null | undefined,
): Money {
  return {
    currency: (currency as Currency) || "USD",
    amount: Number(amount ?? 0),
  }
}

/** Above 0 = has a fee (online or on-site); 0 = free. */
export function isPaid(m: Money): boolean {
  return m.amount > 0
}

/** Smallest unit a currency can actually be charged in: KRW has no subunit. */
export function decimalPlaces(currency: Currency): number {
  return currency === "KRW" ? 0 : 2
}

/**
 * Round to what the currency can actually be charged in.
 *
 * A percentage discount rarely lands on a chargeable amount — 33% off ₩33,000
 * is ₩10,890.00 and off $30.00 is $9.90 — so the result has to be snapped
 * before it reaches the payment row, the PayPal order, or the price shown to
 * the customer. All three must round identically: confirm_booking_payment
 * rejects the capture if the amount does not match the stored one exactly.
 *
 * Half-up rather than JavaScript's round-half-to-even, so 0.125 -> 0.13 and
 * the displayed price never disagrees with the charge by a cent.
 */
export function roundMoney(m: Money): Money {
  const factor = 10 ** decimalPlaces(m.currency)
  // Nudge by Number.EPSILON: 1.005 * 100 is 100.49999999999999 in binary
  // floating point, which would round down and lose a cent.
  const scaled = m.amount * factor
  const rounded = Math.round(scaled + Math.sign(scaled) * Number.EPSILON * Math.abs(scaled))
  return { currency: m.currency, amount: rounded / factor }
}

export type PaymentMode = "free" | "online" | "onsite"

/**
 * How a class is paid for:
 * - free   : no charge (amount 0) — reserve directly, nothing to pay.
 * - online : has a fee paid now via PayPal. PayPal only supports USD, so a USD
 *   price = online.
 * - onsite : has a fee paid in person (any non-USD price, e.g. KRW) — reserve
 *   now, pay at the studio.
 */
export function paymentMode(m: Money): PaymentMode {
  if (m.amount <= 0) return "free"
  return m.currency === "USD" ? "online" : "onsite"
}

/** PayPal decimal amount string, e.g. "30.00". */
export function toPaypalAmount(m: Money): string {
  return m.amount.toFixed(2)
}

/** Localized display: KRW no decimals (ko-KR), otherwise 2 decimals (en-US). */
export function formatMoney(m: Money): string {
  const isKrw = m.currency === "KRW"
  return new Intl.NumberFormat(isKrw ? "ko-KR" : "en-US", {
    style: "currency",
    currency: m.currency,
    ...(isKrw ? { maximumFractionDigits: 0 } : {}),
  }).format(m.amount)
}
