import { normalizeRelation } from "@/lib/supabase/normalize-relation"
import {
  applyDiscount,
  discountFrom,
  money,
  type PricedMoney,
} from "@/lib/payments/money"

/**
 * Shared "booking -> session" summary embed. Used by every query that lists
 * bookings with their session title / time / venue / instructor (public,
 * member, payment, and admin queries), so the select fragment, the
 * array-or-object relation type, and the mapping live in one place.
 */
export const SESSION_SUMMARY_SELECT = `
    title,
    starts_at,
    ends_at,
    price_currency,
    price_amount,
    discount_type,
    discount_value,
    floor:floors (name_en),
    instructor:partners (name_en)
`

type Rel<T> = T | T[] | null

export type SessionSummaryRelation = Rel<{
  title: string
  starts_at: string
  ends_at: string
  price_currency?: string
  price_amount?: number | string
  discount_type?: string | null
  discount_value?: number | string | null
  floor?: Rel<{ name_en: string }>
  instructor?: Rel<{ name_en: string }>
}>

export type SessionSummary = {
  title: string
  startsAt: string
  endsAt: string
  floorName: string
  instructorName: string
  /** List price and the discounted price actually charged. */
  price: PricedMoney
}

const DEFAULT_FALLBACK = { floor: "Brickwell", instructor: "Wellness Guide" }

export function mapSessionSummary(
  relation: SessionSummaryRelation,
  fallback: { floor: string; instructor: string } = DEFAULT_FALLBACK,
): SessionSummary | null {
  const session = normalizeRelation(relation)
  if (!session) return null

  const floor = normalizeRelation(session.floor)
  const instructor = normalizeRelation(session.instructor)

  return {
    title: session.title,
    startsAt: session.starts_at,
    endsAt: session.ends_at,
    floorName: floor?.name_en ?? fallback.floor,
    instructorName: instructor?.name_en ?? fallback.instructor,
    price: applyDiscount(
      money(session.price_currency, session.price_amount),
      discountFrom(session.discount_type, session.discount_value),
    ),
  }
}
