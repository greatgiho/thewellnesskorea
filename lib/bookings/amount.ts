import { createServiceClient } from "@/lib/supabase/service"
import {
  discountFrom,
  money,
  quoteOrder,
  roundMoney,
  type Money,
  type OrderLine,
} from "@/lib/payments/money"
import { ratesForSession } from "@/lib/schedule/tiers"
import { SESSION_TIER_SELECT } from "@/lib/schedule/constants"
import type { SeatTier } from "@/lib/schedule/types"

/**
 * What a booking actually owes.
 *
 * The confirmation screen used to answer this with the class's list price
 * after the session discount, taken straight off the session row. That number
 * is right for exactly one booking: one adult, no tiers, no coupon. A party of
 * two saw half of what they owed. A 50% coupon changed nothing on screen at
 * all.
 *
 * It mattered as soon as won classes started being paid by bank transfer,
 * because the figure beside the account number is the figure somebody types
 * into their banking app. Being wrong there is not a display bug; it is the
 * wrong amount of money arriving, from a person who now believes they have
 * paid.
 *
 * There is no total column on bookings to read instead — the charge has always
 * been derived, in order_total() inside the RPC. So this derives it the same
 * way: the tier lines the booking actually holds, priced with quoteOrder (the
 * mirror of order_total), less whatever coupon was redeemed against it.
 *
 * Separate from getBookingSummaryById rather than folded into it. That summary
 * feeds admin lists and member lists that pull many rows and show none of
 * this, and it describes the class; this describes one booking's bill.
 */

export type BookingAmount = {
  /** Every line at its rate, before any coupon. */
  listTotal: Money
  /** What a coupon took off, or null when none was used. */
  discount: Money | null
  /** listTotal less the coupon — the number to transfer. */
  total: Money
}

type Redemption = { amount_discounted: number | string }

type Row = {
  items: { tier_id: string | null; adult_count: number; child_count: number }[] | null
  /**
   * An object, not an array. coupon_redemptions_booking_key makes booking_id
   * unique, so PostgREST embeds this as a to-one relation — and the first
   * version of this file called .reduce on it, which threw and took the whole
   * bank-transfer panel off the page for exactly the bookings that had a
   * coupon. Both shapes are accepted here rather than trusting the constraint
   * to stay a constraint.
   */
  redemptions: Redemption | Redemption[] | null
  session: SessionRow | SessionRow[] | null
}

type SessionRow = {
  price_currency: string
  price_amount: number | string
  child_price_amount: number | string | null
  discount_type: string | null
  discount_value: number | string | null
  capacity: number
  booked_count: number
  tiers?: SeatTier[] | null
}

function one<T>(value: T | T[] | null | undefined): T | null {
  if (!value) return null
  return Array.isArray(value) ? (value[0] ?? null) : value
}

export async function getBookingAmount(
  bookingId: string,
): Promise<BookingAmount | null> {
  const supabase = createServiceClient()

  const { data, error } = await supabase
    .from("bookings")
    .select(
      `
      items:booking_items (tier_id, adult_count, child_count),
      redemptions:coupon_redemptions (amount_discounted),
      session:sessions (
        price_currency,
        price_amount,
        child_price_amount,
        discount_type,
        discount_value,
        capacity,
        booked_count,
        tiers:session_tiers (${SESSION_TIER_SELECT})
      )
    `,
    )
    .eq("id", bookingId)
    .maybeSingle()

  if (error || !data) return null

  const row = data as unknown as Row
  const session = one(row.session)
  if (!session) return null

  const rates = ratesForSession({
    capacity: session.capacity,
    booked_count: session.booked_count,
    price_amount: Number(session.price_amount ?? 0),
    child_price_amount:
      session.child_price_amount != null
        ? Number(session.child_price_amount)
        : null,
    tiers: session.tiers ?? [],
  })

  const order: OrderLine[] = (row.items ?? []).map((item) => ({
    tierId: item.tier_id,
    adults: item.adult_count,
    children: item.child_count,
  }))

  const priced = quoteOrder(
    session.price_currency,
    discountFrom(session.discount_type, session.discount_value),
    rates,
    order,
  )

  // A cancelled booking releases its row, so anything here is a live discount
  // on a live booking. Summed rather than indexed, so a schema that ever
  // allows two does not silently drop one.
  const redemptions = row.redemptions
    ? Array.isArray(row.redemptions)
      ? row.redemptions
      : [row.redemptions]
    : []
  const discounted = redemptions.reduce(
    (sum, r) => sum + Number(r.amount_discounted ?? 0),
    0,
  )

  const listTotal = priced.total
  if (discounted <= 0) {
    return { listTotal, discount: null, total: listTotal }
  }

  // Clamped at zero. A coupon can never be worth more than the order it came
  // off — check_coupon caps it — but a negative amount printed next to a bank
  // account is not a number anyone should have to interpret.
  const total = roundMoney({
    currency: listTotal.currency,
    amount: Math.max(0, listTotal.amount - discounted),
  })

  return {
    listTotal,
    discount: money(listTotal.currency, discounted),
    total,
  }
}
