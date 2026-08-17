import { siteOrigin } from "@/lib/site-origin"
import { REFERRAL_PARAM } from "@/lib/referrals/cookie"
import {
  formatDateKeyInKst,
  formatDisplayDate,
  formatTimeInKst,
} from "@/lib/schedule/utils"

/**
 * Building the address on a printed card.
 *
 * Kept apart from queries.ts, which is server-only: these are the parts a test
 * can hold still. What they produce ends up on paper, where a mistake cannot
 * be corrected by redeploying.
 */

/**
 * The link a partner hands out.
 *
 * siteOrigin rather than deploymentOrigin: this one gets printed on a card and
 * stuck to a wall. A preview URL would work for a week and then stop, long
 * after anyone remembers where the QR came from.
 */
export function referralLink(code: string, path = "/"): string {
  const url = new URL(path, siteOrigin())
  url.searchParams.set(REFERRAL_PARAM, code)
  return url.toString()
}

/** The booking page for one class — the path a session link is built from. */
export function sessionPath(sessionId: string): string {
  return `/book/${sessionId}`
}

/**
 * "2026년 8월 22일 토 09:23", in KST — the same shape the schedule screens use.
 *
 * Read in KST rather than sliced off the ISO string. A class at 08:00 KST is
 * stored as 23:00 the previous day in UTC, and taking the date off the string
 * labelled every morning class with yesterday — on the ticket and in the
 * confirmation email, until #176. The same slip here would print a QR card
 * saying the wrong day.
 */
export function formatSessionWhen(startsAt: string): string {
  const dateKey = formatDateKeyInKst(new Date(startsAt))
  return `${formatDisplayDate(dateKey)} ${formatTimeInKst(startsAt)}`
}
