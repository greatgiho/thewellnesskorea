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

export type AttendeeType = "adult" | "child"

/**
 * The list price for one attendee type, before any discount.
 *
 * Mirrors session_base_price() in the database, which is what the booking
 * transaction actually charges from. A class with no child rate has
 * `childAmount` null, and a child ticket then costs what an adult one does —
 * the booking RPCs refuse a child ticket on such a class outright, so this
 * fallback is only ever reached by a screen asking a hypothetical question.
 */
export function basePriceFor(
  currency: string | null | undefined,
  amount: number | string | null | undefined,
  childAmount: number | string | null | undefined,
  attendeeType: AttendeeType,
): Money {
  if (attendeeType === "child" && childAmount != null) {
    return money(currency, childAmount)
  }
  return money(currency, amount)
}

export type DiscountType = "fixed" | "percent"
export type Discount = { type: DiscountType; value: number }

/** A price with its discount resolved: what it was, what it is, how much off. */
export type PricedMoney = {
  original: Money
  final: Money
  discount: Discount | null
  /** Rounded whole percent, for the "(50% off)" label. 0 when undiscounted. */
  percentOff: number
}

/** Read a discount off a session row; null unless both columns are set. */
export function discountFrom(
  type: string | null | undefined,
  value: number | string | null | undefined,
): Discount | null {
  if (type !== "fixed" && type !== "percent") return null
  const amount = Number(value ?? 0)
  if (!Number.isFinite(amount) || amount <= 0) return null
  return { type, value: amount }
}

/**
 * Apply a discount to a price.
 *
 * Mirrors session_final_price() in the database, which is what actually gets
 * charged — the two must agree or confirm_booking_payment rejects the capture
 * for an amount mismatch. Keep them in step.
 *
 * The result is clamped at zero so an oversized fixed discount cannot produce
 * a negative charge, and rounded to what the currency can be charged in.
 */
export function applyDiscount(
  price: Money,
  discount: Discount | null,
): PricedMoney {
  if (!discount) {
    return { original: price, final: price, discount: null, percentOff: 0 }
  }

  const raw =
    discount.type === "percent"
      ? price.amount - (price.amount * discount.value) / 100
      : price.amount - discount.value

  const final = roundMoney({
    currency: price.currency,
    amount: Math.max(0, raw),
  })

  // Derive the label from the actual prices rather than the configured value,
  // so a fixed discount also reads as a percentage and rounding is reflected.
  const percentOff =
    price.amount > 0
      ? Math.round(((price.amount - final.amount) / price.amount) * 100)
      : 0

  return { original: price, final, discount, percentOff }
}

/** True when the final price is below the original. */
export function isDiscounted(priced: PricedMoney): boolean {
  return priced.final.amount < priced.original.amount
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

// ---------------------------------------------------------------------------
// Parties
// ---------------------------------------------------------------------------

/** Who a single booking is for. One booking, one payment, one ticket. */
export type Party = { adults: number; children: number }

/**
 * Ten people is where self-service stops and someone should talk to us.
 * Enforced in the booking RPCs too — this is the number the form shows.
 */
export const MAX_PARTY_SIZE = 10

export function partySize(party: Party): number {
  return party.adults + party.children
}

export type PartyQuote = {
  /** Per-person prices, discount resolved, for the line items. */
  adult: PricedMoney
  /** Null when the class has no child rate, which is also when none is offered. */
  child: PricedMoney | null
  party: Party
  size: number
  /** What the whole booking costs, before any coupon. */
  total: Money
}

/**
 * What a party costs.
 *
 * Mirrors party_total() in the database, which is what actually gets charged.
 * Each rate is discounted and rounded on its own and only then multiplied:
 * rounding the unit rather than the total is what makes the line items add up
 * to the total on screen, and what keeps this in step with the amount the
 * capture is checked against.
 */
export function quoteParty(
  currency: string | null | undefined,
  amount: number | string | null | undefined,
  childAmount: number | string | null | undefined,
  discount: Discount | null,
  party: Party,
): PartyQuote {
  const adult = applyDiscount(money(currency, amount), discount)
  const child =
    childAmount != null
      ? applyDiscount(money(currency, childAmount), discount)
      : null

  const total = roundMoney({
    currency: adult.final.currency,
    amount:
      party.adults * adult.final.amount +
      party.children * (child?.final.amount ?? adult.final.amount),
  })

  return { adult, child, party, size: partySize(party), total }
}

/**
 * What the party would cost with no discount at all.
 *
 * Mirrors party_list_total(). This is the figure a coupon comes off in the
 * database, so it is also the one a "% off" label has to be measured against.
 */
export function partyListTotal(quote: PartyQuote): Money {
  const childOriginal = quote.child?.original.amount ?? quote.adult.original.amount
  return roundMoney({
    currency: quote.adult.original.currency,
    amount:
      quote.party.adults * quote.adult.original.amount +
      quote.party.children * childOriginal,
  })
}

// ---------------------------------------------------------------------------
// Orders across seat tiers
// ---------------------------------------------------------------------------

/**
 * One rate card: a seat tier, or the class itself when it has no tiers.
 *
 * `id` null is the tier-less class. The booking RPCs use the same convention,
 * and it is what lets a class that never had tiers keep behaving as it did.
 */
export type TierRate = {
  id: string | null
  code: string
  name: string | null
  priceAmount: number
  childPriceAmount: number | null
  capacity: number
  bookedCount: number
}

/** How many of one tier an order is asking for. */
export type OrderLine = { tierId: string | null; adults: number; children: number }

export type OrderLineQuote = {
  rate: TierRate
  quote: PartyQuote
}

export type OrderQuote = {
  lines: OrderLineQuote[]
  size: number
  total: Money
}

/** Seats still on sale in a tier. */
export function tierSeatsLeft(rate: TierRate): number {
  return Math.max(0, rate.capacity - rate.bookedCount)
}

/**
 * What a whole order costs.
 *
 * Mirrors order_total() in the database, which is what actually gets charged.
 * Each line is priced by the same per-person rounding quoteParty() does, then
 * the lines are summed — so the total on screen is the sum of the line totals
 * on screen, and it matches the amount a capture is checked against.
 *
 * Lines asking for nobody are dropped rather than shown as a zero: an order is
 * the tiers someone is actually buying.
 */
export function quoteOrder(
  currency: string | null | undefined,
  discount: Discount | null,
  rates: TierRate[],
  order: OrderLine[],
): OrderQuote {
  const lines: OrderLineQuote[] = []

  for (const rate of rates) {
    const line = order.find((l) => l.tierId === rate.id)
    const party = { adults: line?.adults ?? 0, children: line?.children ?? 0 }
    lines.push({
      rate,
      quote: quoteParty(
        currency,
        rate.priceAmount,
        rate.childPriceAmount,
        discount,
        party,
      ),
    })
  }

  const total = roundMoney({
    currency: (currency as Currency) || "USD",
    amount: lines.reduce((sum, l) => sum + l.quote.total.amount, 0),
  })

  return {
    lines,
    size: lines.reduce((sum, l) => sum + l.quote.size, 0),
    total,
  }
}

/** The order with no discount at all — what a coupon comes off. */
export function orderListTotal(order: OrderQuote): Money {
  return roundMoney({
    currency: order.total.currency,
    amount: order.lines.reduce(
      (sum, l) => sum + partyListTotal(l.quote).amount,
      0,
    ),
  })
}

/** The lines worth sending: tiers nobody is buying are not part of the order. */
export function orderLines(order: OrderQuote): OrderLine[] {
  return order.lines
    .filter((l) => l.quote.size > 0)
    .map((l) => ({
      tierId: l.rate.id,
      adults: l.quote.party.adults,
      children: l.quote.party.children,
    }))
}
