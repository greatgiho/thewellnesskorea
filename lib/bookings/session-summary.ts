import { normalizeRelation } from "@/lib/supabase/normalize-relation"
import { normalizeDescriptionBlocks } from "@/lib/schedule/images"
import type { SessionDescriptionBlocks } from "@/lib/schedule/types"
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

/**
 * The class snapshot, kept out of SESSION_SUMMARY_SELECT on purpose.
 *
 * description_blocks is jsonb and can run to a few kilobytes; the summary embed
 * is used by the admin booking list and the member list, which pull many rows
 * and show none of this. Only the two screens that render it ask for it.
 */
export const SESSION_SNAPSHOT_SELECT = `
    image_paths,
    description_blocks
`

export type SessionSnapshot = {
  images: string[]
  blocks: SessionDescriptionBlocks
}

export function mapSessionSnapshot(
  relation: SessionSummaryRelation,
): SessionSnapshot | null {
  const session = normalizeRelation(relation) as
    | { image_paths?: string[] | null; description_blocks?: unknown }
    | null
  if (!session) return null

  const blocks = normalizeDescriptionBlocks(session.description_blocks)
  const images = session.image_paths ?? []
  // Nothing to show is not a snapshot. Saying so here keeps the branch out of
  // the component.
  if (images.length === 0 && !blocks.intro && !blocks.progress && !blocks.preparation) {
    return null
  }
  return { images, blocks }
}

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
