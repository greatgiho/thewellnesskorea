import type { TierRate } from "@/lib/payments/money"
import type { SeatTier } from "./types"

/**
 * The rate cards a class is sold at.
 *
 * A class with seat tiers has one per tier. A class without them has exactly
 * one, standing in for the session's own price and capacity — the same
 * substitution order_total() makes in the database when a line's tier_id is
 * null. Having one shape for both is what keeps the booking form, the quote
 * and the RPC from each needing a "does this class have tiers" branch.
 */
export function ratesForSession(session: {
  capacity: number
  booked_count: number
  price_amount: number
  child_price_amount: number | null
  tiers?: SeatTier[]
}): TierRate[] {
  const tiers = session.tiers ?? []

  if (tiers.length === 0) {
    return [
      {
        id: null,
        code: "",
        name: null,
        priceAmount: Number(session.price_amount ?? 0),
        childPriceAmount:
          session.child_price_amount != null
            ? Number(session.child_price_amount)
            : null,
        capacity: session.capacity,
        bookedCount: session.booked_count,
      },
    ]
  }

  return [...tiers]
    .sort((a, b) => a.sort_order - b.sort_order)
    .map((t) => ({
      id: t.id,
      code: t.code,
      name: t.name,
      priceAmount: Number(t.price_amount ?? 0),
      childPriceAmount:
        t.child_price_amount != null ? Number(t.child_price_amount) : null,
      capacity: t.capacity,
      bookedCount: t.booked_count,
    }))
}

/** True when the class is sold by grade rather than at one price. */
export function hasSeatTiers(session: { tiers?: SeatTier[] }): boolean {
  return (session.tiers?.length ?? 0) > 0
}

/** "R석" / "R석 · 앞 3열". Empty for a class with no tiers. */
export function tierLabel(rate: { code: string; name: string | null }): string {
  if (!rate.code) return ""
  return rate.name ? `${rate.code} · ${rate.name}` : rate.code
}
