import { getSessionPhotoUrl } from "./images"
import { formatTimeInKst } from "./utils"
import { KST_TIMEZONE } from "./constants"
import type { ContentCategory, RedesignSessionRow } from "./redesign-content"

export type BilingualText = { en: string; ko: string }

export type BrickwellItem = {
  id: string
  title: BilingualText
  meta: BilingualText
  place: BilingualText
  blurb: BilingualText
  body: BilingualText
  image: string
}

export type PastEventItem = {
  id: string
  title: string
  season: string
  image: string
  note: string
}

export type ReservationItem = {
  id: string
  dateBadge: { en: { month: string; day: string }; ko: { month: string; day: string } }
  tag: BilingualText | null
  title: BilingualText
  time: BilingualText
  place: BilingualText
  body: BilingualText
  spots: number
  /** The upcoming query keeps everything from 00:00 KST today, but
   *  getBookableSession only accepts starts_at in the future, so a class that
   *  ran this morning would link to a 404. Decided here rather than in the
   *  component: the card ships to the client, and a browser clock must not
   *  disagree with the page it links to. */
  hasStarted: boolean
}

const CONTENT_CATEGORY_LABEL: Record<ContentCategory, BilingualText> = {
  day: { en: "Day", ko: "낮" },
  night: { en: "Night", ko: "밤" },
  exhibition: { en: "Exhibition", ko: "전시" },
}

function formatMeta(session: RedesignSessionRow): BilingualText {
  const date = new Date(session.starts_at)
  const en = new Intl.DateTimeFormat("en-US", {
    timeZone: KST_TIMEZONE,
    weekday: "short",
    month: "short",
    day: "numeric",
  }).format(date)
  const ko = new Intl.DateTimeFormat("ko-KR", {
    timeZone: KST_TIMEZONE,
    weekday: "short",
    month: "long",
    day: "numeric",
  }).format(date)
  const time = formatTimeInKst(session.starts_at)
  return { en: `${en} · ${time}`, ko: `${ko} · ${time}` }
}

// description_blocks has no ko variant yet — shown as-is in both languages
// until that's worth splitting too. title_ko falls back to the English
// title when a session hasn't been backfilled yet.
export function toBrickwellItem(session: RedesignSessionRow): BrickwellItem {
  const body = session.description_blocks.intro
  return {
    id: session.id,
    title: { en: session.title, ko: session.title_ko ?? session.title },
    meta: formatMeta(session),
    place: {
      en: session.location_label_en ?? session.floor?.name_en ?? "",
      ko: session.location_label_ko ?? session.floor?.name_ko ?? "",
    },
    blurb: { en: session.blurb_en ?? "", ko: session.blurb_ko ?? "" },
    body: { en: body, ko: body },
    image: getSessionPhotoUrl(session.image_paths[0]),
  }
}

export function groupByContentCategory(
  sessions: RedesignSessionRow[],
): Record<ContentCategory, BrickwellItem[]> {
  const grouped: Record<ContentCategory, BrickwellItem[]> = {
    day: [],
    night: [],
    exhibition: [],
  }
  for (const session of sessions) {
    if (!session.content_category) continue
    grouped[session.content_category].push(toBrickwellItem(session))
  }
  return grouped
}

function formatDateBadge(session: RedesignSessionRow): ReservationItem["dateBadge"] {
  const date = new Date(session.starts_at)
  const enMonth = new Intl.DateTimeFormat("en-US", {
    timeZone: KST_TIMEZONE,
    month: "short",
  })
    .format(date)
    .toUpperCase()
  const day = new Intl.DateTimeFormat("en-US", {
    timeZone: KST_TIMEZONE,
    day: "numeric",
  }).format(date)
  const koMonth = `${new Intl.DateTimeFormat("ko-KR", {
    timeZone: KST_TIMEZONE,
    month: "numeric",
  }).format(date)}월`
  return {
    en: { month: enMonth, day },
    ko: { month: koMonth, day: `${day}일` },
  }
}

function formatReservationTime(session: RedesignSessionRow): BilingualText {
  const date = new Date(session.starts_at)
  const enWeekday = new Intl.DateTimeFormat("en-US", {
    timeZone: KST_TIMEZONE,
    weekday: "short",
  }).format(date)
  const koWeekday = new Intl.DateTimeFormat("ko-KR", {
    timeZone: KST_TIMEZONE,
    weekday: "short",
  }).format(date)
  const time = formatTimeInKst(session.starts_at)
  return { en: `${enWeekday} · ${time}`, ko: `${koWeekday} · ${time}` }
}

// One row of the Upcoming list: the original's date badge / body / place /
// category tag, over a real session's seats and booking link. The original
// carried a photo per row too; its list layout has no room for one, so no
// image is mapped here.
export function toReservationItem(session: RedesignSessionRow): ReservationItem {
  const body = session.blurb_en || session.description_blocks.intro
  const bodyKo = session.blurb_ko || session.description_blocks.intro
  return {
    id: session.id,
    dateBadge: formatDateBadge(session),
    tag: session.content_category
      ? CONTENT_CATEGORY_LABEL[session.content_category]
      : null,
    title: { en: session.title, ko: session.title_ko ?? session.title },
    time: formatReservationTime(session),
    place: {
      en: session.location_label_en ?? session.floor?.name_en ?? "",
      ko: session.location_label_ko ?? session.floor?.name_ko ?? "",
    },
    body: { en: body, ko: bodyKo },
    spots: Math.max(0, session.capacity - session.booked_count),
    hasStarted: new Date(session.starts_at).getTime() <= Date.now(),
  }
}

export function toReservationItems(sessions: RedesignSessionRow[]): ReservationItem[] {
  return sessions.map(toReservationItem)
}

export function toPastEvents(sessions: RedesignSessionRow[]): PastEventItem[] {
  return sessions.map((session) => ({
    id: session.id,
    title: session.title,
    season: new Intl.DateTimeFormat("en-US", {
      timeZone: KST_TIMEZONE,
      month: "short",
      year: "numeric",
    }).format(new Date(session.starts_at)),
    // The archive is a wall of photographs, so it reads the session's own
    // photo; getSessionPhotoUrl falls back to the placeholder when a session
    // has none.
    image: getSessionPhotoUrl(session.image_paths[0]),
    note: session.blurb_en || session.description_blocks.intro,
  }))
}
