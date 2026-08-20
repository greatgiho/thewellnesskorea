/**
 * Saying a time to a person.
 *
 * Everything we run happens in Seoul, and everything we store is UTC. That gap
 * has cost us twice now: tickets and confirmation emails labelled every class
 * before 09:00 KST with yesterday's date (#176), because the date was sliced
 * off an ISO string instead of read in the venue's timezone.
 *
 * The same mistake was still live in seven more places when this module was
 * written — journal cards, community posts, the booking roster — each with its
 * own private formatDate that omitted the timezone and therefore rendered in
 * whatever zone the server happened to be in. On Vercel that is UTC.
 *
 * So: one module. If a date or a time is shown to a human, it is built here,
 * and there is no way to build one without a timezone.
 *
 * This is deliberately not in lib/schedule. Bookings, tickets, emails and
 * referrals all need to print a time, and none of them are the schedule —
 * having them import a schedule module to do it is what let the copies spread.
 */

export const KST_TIMEZONE = "Asia/Seoul"

/** Which language the reader is in. The venue is Korean; the site is both. */
export type Lang = "en" | "ko"

const LOCALE: Record<Lang, string> = { en: "en-US", ko: "ko-KR" }

// ---------------------------------------------------------------------------
// Date keys — the calendar day in Seoul, as YYYY-MM-DD
// ---------------------------------------------------------------------------

/**
 * The calendar day an instant falls on in Seoul.
 *
 * en-CA because it formats as YYYY-MM-DD, which sorts and compares. Not a
 * display format — it is the key the schedule is organised by.
 */
export function formatDateKeyInKst(date: Date): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: KST_TIMEZONE }).format(date)
}

/** Today in Seoul, whatever the server thinks the date is. */
export function todayDateKeyInKst(): string {
  return formatDateKeyInKst(new Date())
}

/**
 * Midday UTC on a date key.
 *
 * Midday, not midnight: from noon UTC, no timezone we format into can land on
 * a different calendar day, so the key survives the round trip.
 */
export function dateKeyToUtcDate(dateKey: string): Date {
  const [y, m, d] = dateKey.split("-").map(Number)
  return new Date(Date.UTC(y, m - 1, d, 12, 0, 0))
}

export function addDaysToDateKey(dateKey: string, days: number): string {
  const [y, m, d] = dateKey.split("-").map(Number)
  return formatDateKeyInKst(new Date(Date.UTC(y, m - 1, d + days)))
}

// ---------------------------------------------------------------------------
// Display
// ---------------------------------------------------------------------------

/** 24-hour clock time in Seoul: "20:00". */
export function formatTimeInKst(iso: string): string {
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: KST_TIMEZONE,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(new Date(iso))
}

/**
 * 24-hour clock time in Seoul, to the second: "20:00:07".
 *
 * Seconds because this is used to tell two things that happened close together
 * apart — two people who gave the same name a minute apart are still two
 * people, and to the minute they would read as one.
 */
export function formatClockInKst(iso: string): string {
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: KST_TIMEZONE,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).format(new Date(iso))
}

/** A date key spelled out in Korean: "2026년 8월 25일 화". */
export function formatDisplayDate(dateKey: string): string {
  return new Intl.DateTimeFormat(LOCALE.ko, {
    timeZone: KST_TIMEZONE,
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "short",
  }).format(dateKeyToUtcDate(dateKey))
}

/**
 * Options rather than positional arguments.
 *
 * formatKstDate(iso, "en", "short") does not say at the call site what "short"
 * is short for. Korean is the default because the venue, the admin and most of
 * the readers are.
 */
type DateOptions = {
  lang?: Lang
  /** "short" for table columns, where the year repeats on every row. */
  month?: "long" | "short"
  /** Worth showing when someone has to turn up on the right day. */
  weekday?: boolean
}

/** The day an instant falls on, for a reader. */
export function formatKstDate(
  iso: string,
  { lang = "ko", month = "long", weekday = false }: DateOptions = {},
): string {
  return new Intl.DateTimeFormat(LOCALE[lang], {
    timeZone: KST_TIMEZONE,
    year: "numeric",
    month,
    day: "numeric",
    ...(weekday ? { weekday: "short" as const } : {}),
  }).format(new Date(iso))
}

/** The day and the clock time: for anything someone might have to reconcile. */
export function formatKstDateTime(
  iso: string,
  { lang = "ko" }: { lang?: Lang } = {},
): string {
  return new Intl.DateTimeFormat(LOCALE[lang], {
    timeZone: KST_TIMEZONE,
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso))
}

/** "August 2026" — for an archive heading, where the day does not matter. */
export function formatKstMonthYear(
  iso: string,
  { lang = "en" }: { lang?: Lang } = {},
): string {
  return new Intl.DateTimeFormat(LOCALE[lang], {
    timeZone: KST_TIMEZONE,
    year: "numeric",
    month: "long",
  }).format(new Date(iso))
}
