import { formatParty } from "./format"

/**
 * What a booking is made of, as every screen needs to read it.
 *
 * The counts moved off the booking row and onto booking_items when seat tiers
 * arrived, so five different queries now have to embed the same relation and
 * fold it the same way. That fold lives here rather than in each of them.
 */

export const BOOKING_ITEMS_SELECT = `
  items:booking_items (
    adult_count,
    child_count,
    tier:session_tiers (code, name, sort_order)
  )
`

export type BookingItemRow = {
  adult_count: number
  child_count: number
  tier:
    | { code: string; name: string | null; sort_order: number }
    | { code: string; name: string | null; sort_order: number }[]
    | null
}

export type BookingLine = {
  /** Null for a class sold at one price rather than by grade. */
  tierCode: string | null
  tierName: string | null
  adults: number
  children: number
  size: number
}

function one<T>(value: T | T[] | null | undefined): T | null {
  if (!value) return null
  return Array.isArray(value) ? (value[0] ?? null) : value
}

export function toBookingLines(
  rows: BookingItemRow[] | null | undefined,
): BookingLine[] {
  return (rows ?? [])
    .map((row) => {
      const tier = one(row.tier)
      return {
        tierCode: tier?.code ?? null,
        tierName: tier?.name ?? null,
        adults: row.adult_count,
        children: row.child_count,
        size: row.adult_count + row.child_count,
        sortOrder: tier?.sort_order ?? 0,
      }
    })
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map(({ sortOrder: _sortOrder, ...line }) => line)
}

/** Everyone on the booking, across every tier. */
export function partyOf(lines: BookingLine[]): {
  adults: number
  children: number
  size: number
} {
  return lines.reduce(
    (acc, l) => ({
      adults: acc.adults + l.adults,
      children: acc.children + l.children,
      size: acc.size + l.size,
    }),
    { adults: 0, children: 0, size: 0 },
  )
}

/**
 * The booking in one line: "R석 2 adults · 1 child, S석 1 adult".
 *
 * Without tiers this is just the party, unchanged — the grade is only worth
 * naming when there is more than one to choose from.
 */
export function formatOrder(lines: BookingLine[]): string {
  if (lines.length === 0) return ""
  if (lines.length === 1 && lines[0].tierCode === null) {
    return formatParty(lines[0].adults, lines[0].children)
  }
  return lines
    .map((l) =>
      [l.tierCode, formatParty(l.adults, l.children)].filter(Boolean).join(" "),
    )
    .join(", ")
}
