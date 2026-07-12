import { normalizeRelation } from "@/lib/supabase/normalize-relation"

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
  floor?: Rel<{ name_en: string }>
  instructor?: Rel<{ name_en: string }>
}>

export type SessionSummary = {
  title: string
  startsAt: string
  endsAt: string
  floorName: string
  instructorName: string
  priceCurrency: string
  priceAmount: number
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
    priceCurrency: session.price_currency ?? "USD",
    priceAmount: Number(session.price_amount ?? 0),
  }
}
