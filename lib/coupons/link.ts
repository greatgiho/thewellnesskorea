import { sessionPath } from "@/lib/referrals/links"
import { siteOrigin } from "@/lib/site-origin"

/**
 * Handing a coupon to somebody as a link instead of as an instruction.
 *
 * The code has always worked; what did not work was giving it away. "Your
 * code is WELCOME20, type it into the coupon box when you book" is three
 * sentences of homework attached to a discount, and the homework is where
 * people leave.
 *
 * Nothing here is trusted. The booking transaction re-checks the code under a
 * lock (038) and the price is computed server-side from the session row, so a
 * link is a shortcut past the keyboard and nothing more. Editing the address
 * bar invents a coupon exactly as successfully as typing the same string into
 * the box would.
 *
 * siteOrigin rather than deploymentOrigin, for the reason referrals/links
 * gives: this gets pasted into a message and read weeks later, and a preview
 * URL stops resolving long before anyone remembers where the link came from.
 */

export const COUPON_PARAM = "coupon"

/** The full link for a coupon that belongs to one class. */
export function couponLink(sessionId: string, code: string): string {
  const url = new URL(sessionPath(sessionId), siteOrigin())
  url.searchParams.set(COUPON_PARAM, normalizeCouponCode(code))
  return url.toString()
}

/**
 * What to append to any booking link, for a coupon that is not tied to one
 * class.
 *
 * A coupon scoped to an experience — or to everything — has no single class to
 * point at, and picking one for the admin to copy would be inventing a
 * recommendation the coupon never made. The suffix is the honest answer: it
 * works on whichever class the recipient was already being sent to.
 */
export function couponQuerySuffix(code: string): string {
  return `?${COUPON_PARAM}=${encodeURIComponent(normalizeCouponCode(code))}`
}

/**
 * The form the database matches on.
 *
 * coupons_code_key is a unique index over `upper(btrim(code))`, and check_coupon
 * normalizes the same way, so 'welcome20' and ' Welcome20 ' are the same coupon.
 * Doing it here too means the link carries the code as it is stored, and
 * somebody comparing an address against the admin screen sees one string rather
 * than two spellings of one.
 */
export function normalizeCouponCode(code: string): string {
  return code.trim().toUpperCase()
}

/**
 * The code carried by a URL, or null.
 *
 * Next hands a repeated query parameter over as an array; a coupon box can
 * only hold one code, so the first wins rather than the last — `?coupon=A&
 * coupon=B` is a malformed link either way, and picking the first at least
 * matches what a reader of the address would guess.
 */
export function couponFromParam(
  value: string | string[] | undefined,
): string | null {
  const raw = Array.isArray(value) ? value[0] : value
  if (typeof raw !== "string") return null
  const code = normalizeCouponCode(raw)
  return code || null
}
