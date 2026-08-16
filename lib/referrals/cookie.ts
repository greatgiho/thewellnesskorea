/**
 * Carrying a referral from the link that was clicked to the booking that
 * eventually happens.
 *
 * Nobody books in the same breath as clicking a link on a flyer. They land,
 * read, leave, and come back later — so the code has to survive that gap, and
 * a cookie is the only thing that does without an account.
 *
 * Thirty days, last click wins. Both are choices rather than truths: thirty
 * days is long enough to cover "I'll book it this weekend" and short enough
 * that a partner cannot claim a booking made a season later, and last-click is
 * what the person can actually explain to two partners who both think the
 * booking is theirs. Written down here because a statement is only defensible
 * if the rule behind it was fixed in advance.
 */

export const REFERRAL_COOKIE = "twk_ref"
export const REFERRAL_MAX_AGE = 60 * 60 * 24 * 30 // 30 days
export const REFERRAL_PARAM = "ref"

/** The shape a code is allowed to take, matching referrers_code_format. */
const CODE = /^[A-Za-z0-9_-]{2,32}$/

/**
 * A usable code, or null.
 *
 * Validated before it goes anywhere near a cookie or a query, because this
 * value arrives in a URL anyone can type. Nothing downstream should have to
 * wonder whether it was checked.
 */
export function normalizeReferralCode(
  raw: string | null | undefined,
): string | null {
  if (!raw) return null
  const trimmed = raw.trim()
  return CODE.test(trimmed) ? trimmed : null
}
