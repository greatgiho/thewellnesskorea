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
 * A partner's own page — where their QR lands.
 *
 * Their profile rather than the front page: it already lists their upcoming
 * classes, so someone who scanned a teacher's code arrives at that teacher's
 * classes instead of at everything we run.
 */
export function partnerPath(slug: string): string {
  return `/partners/${slug}`
}

/**
 * The plain address of the site, with no code on it.
 *
 * This is the QR for our own poster, so it is not a referral: nobody is owed
 * anything for it, and giving it a code would put a line in the settlement
 * list that can never be paid.
 */
export function siteLink(): string {
  return new URL("/", siteOrigin()).toString()
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

/**
 * What a downloaded QR is called.
 *
 * Five cafés get five QRs, and the folder they land in fills up with
 * qrcode(3).png. Carrying the code and the class in the name is the difference
 * between reprinting one and reprinting all five.
 *
 * Korean is kept. This is read by people who read Korean, and every system
 * these files touch handles it; only the characters a filesystem actually
 * refuses are stripped.
 */
export function qrFilename(...parts: (string | null | undefined)[]): string {
  const name = ["twk-qr", ...parts]
    .filter((p): p is string => Boolean(p && p.trim()))
    .map((p) =>
      p
        .replace(/[\\/:*?"<>|]+/g, "")
        .trim()
        .replace(/\s+/g, "-"),
    )
    .filter(Boolean)
    .join("-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")

  // 80 is short of every limit that matters and long enough for a code, a
  // class name and a date.
  return name.slice(0, 80) || "twk-qr"
}

/** The class date as a filename would carry it: 20260825, in KST. */
export function qrDateStamp(startsAt: string): string {
  return formatDateKeyInKst(new Date(startsAt)).replace(/-/g, "")
}
