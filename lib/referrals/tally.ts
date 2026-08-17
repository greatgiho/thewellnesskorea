/**
 * Turning referred bookings into the two lists a settlement needs.
 *
 * The database is read once, flat: one row per (referrer, class). Everything
 * a screen wants is a regrouping of that — per class, to see who brought whom,
 * and per referrer, to see what one partner is owed across everything. Doing
 * it here rather than in SQL keeps both views reading the same numbers, which
 * is the whole reason a partner will accept them.
 */

export type Money = { currency: string; amount: number }

export type ReferralTally = {
  /** lower(code) — bookings keep the referrer's own spelling, this matches. */
  code: string
  sessionId: string | null
  sessionTitle: string
  sessionStartsAt: string | null
  /** Every booking stamped with this code for this class. */
  total: number
  /** Confirmed and still standing. */
  confirmed: number
  /** Cancelled after the fact, or a hold that lapsed unpaid. */
  lost: number
  /** Money taken and not refunded, by currency. */
  revenue: Money[]
}

export type ReferralTotals = {
  total: number
  confirmed: number
  lost: number
  revenue: Money[]
}

/** Add to the running total for a currency, or start one. */
export function addMoney(into: Money[], currency: string, amount: number): void {
  const line = into.find((m) => m.currency === currency)
  if (line) line.amount += amount
  else into.push({ currency, amount })
}

const empty = (): ReferralTotals => ({
  total: 0,
  confirmed: 0,
  lost: 0,
  revenue: [],
})

function accumulate(into: ReferralTotals, tally: ReferralTally): void {
  into.total += tally.total
  into.confirmed += tally.confirmed
  into.lost += tally.lost
  for (const m of tally.revenue) addMoney(into.revenue, m.currency, m.amount)
}

/**
 * What each referrer is owed across every class — the settlement view.
 *
 * Keyed by lower(code), because that is what the referrers table is unique on
 * and what a code typed off a card comes back as.
 */
export function totalsByCode(
  tallies: ReferralTally[],
): Map<string, ReferralTotals> {
  const out = new Map<string, ReferralTotals>()
  for (const tally of tallies) {
    const entry = out.get(tally.code) ?? empty()
    accumulate(entry, tally)
    out.set(tally.code, entry)
  }
  return out
}

/**
 * Who brought bookings to each class.
 *
 * Sorted by takings within a class rather than by name: on a class card the
 * line worth reading first is the one that sold. Bookings with no class — none
 * exist today, since session_id is not null — are dropped rather than bucketed
 * under an empty key.
 */
export function talliesBySession(
  tallies: ReferralTally[],
): Map<string, ReferralTally[]> {
  const out = new Map<string, ReferralTally[]>()
  for (const tally of tallies) {
    if (!tally.sessionId) continue
    const list = out.get(tally.sessionId) ?? []
    list.push(tally)
    out.set(tally.sessionId, list)
  }
  for (const list of out.values()) {
    list.sort((a, b) => b.confirmed - a.confirmed || b.total - a.total)
  }
  return out
}
