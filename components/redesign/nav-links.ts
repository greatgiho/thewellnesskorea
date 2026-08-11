import type { BilingualText } from "@/lib/schedule/map-redesign-content"

/**
 * The homepage sections the chrome links to, in one place.
 *
 * Every entry must name a section the homepage actually renders. Nothing checks
 * this — an anchor pointing at a section that no longer exists type-checks,
 * builds, and silently does nothing when clicked. That is how the nav's
 * "Reserve" spent the redesign pointing at #reserve, a panel we never render,
 * and how the old chrome's links still point at #schedule, a section the
 * redesign replaced.
 */
export const SECTION_LINKS: { id: string; label: BilingualText }[] = [
  { id: "philosophy", label: { en: "Philosophy", ko: "철학" } },
  { id: "day", label: { en: "Day", ko: "낮" } },
  { id: "night", label: { en: "Night", ko: "밤" } },
  { id: "exhibition", label: { en: "Exhibition", ko: "전시" } },
  { id: "upcoming", label: { en: "Reserve", ko: "예약" } },
]

/**
 * The footer lists more than the nav does.
 *
 * The pre-redesign footer carried a sitemap column — Five Paths, Wellness
 * Guides, Artists, Schedule, Journal — and it was the one place every section
 * was reachable by name. The nav stays as the design drew it (three rhythms,
 * one reserve); the sections that would otherwise have no named entry point
 * live here.
 */
export const FOOTER_SECTION_LINKS: { id: string; label: BilingualText }[] = [
  { id: "philosophy", label: { en: "Philosophy", ko: "철학" } },
  { id: "paths", label: { en: "Five Paths", ko: "다섯 갈래" } },
  { id: "people", label: { en: "People", ko: "함께하는 사람들" } },
  { id: "day", label: { en: "Day", ko: "낮" } },
  { id: "night", label: { en: "Night", ko: "밤" } },
  { id: "exhibition", label: { en: "Exhibition", ko: "전시" } },
  { id: "upcoming", label: { en: "Reserve", ko: "예약" } },
]

/**
 * A link to a homepage section, from wherever the reader currently is.
 *
 * On the homepage this stays a bare fragment so the browser just scrolls. From
 * anywhere else it has to be a full path, or the anchor resolves against the
 * current page and does nothing.
 */
export function sectionHref(pathname: string, id: string): string {
  return pathname === "/" ? `#${id}` : `/#${id}`
}

/** Pages outside the homepage that the chrome links to directly. */
export const PAGE_LINKS: { href: string; label: BilingualText }[] = [
  { href: "/journal", label: { en: "Journal", ko: "저널" } },
  { href: "/privacy", label: { en: "Privacy", ko: "개인정보" } },
  { href: "/terms", label: { en: "Terms", ko: "이용약관" } },
]
