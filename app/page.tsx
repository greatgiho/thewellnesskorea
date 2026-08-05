/**
 * The homepage is the v0 redesign (components/redesign/*).
 *
 * This is the same composition the preview at /dev/redesign renders, minus the
 * flag that gates it. The sections it drops relative to the old homepage —
 * WhyKorea, Paths, Guides, Artists, and the multi-experience hero carousel —
 * have no equivalent here: the redesign is built around the single `brickwell`
 * experience, and its own information architecture (Brickwell / Upcoming /
 * Past) replaces rather than reorganises them. The previous page is kept
 * verbatim at app/page.pre-redesign-backup.tsx, which is not a route.
 *
 * Brickwell reads sessions tagged with content_category (migration 049). Until
 * sessions carry that tag the section renders its empty state; the queries
 * swallow their errors the way the rest of lib/schedule does, so an unapplied
 * migration shows as "nothing here" rather than a crash.
 *
 * Cards link into the existing /book/[sessionId] flow rather than
 * re-implementing booking.
 */
import { LanguageProvider } from "@/components/redesign/language-provider"
import { SiteNav } from "@/components/redesign/site-nav"
import { HeroCanvas } from "@/components/redesign/hero-canvas"
import { Philosophy } from "@/components/redesign/philosophy"
import { Brickwell } from "@/components/redesign/brickwell"
import { UpcomingEvents } from "@/components/redesign/upcoming-events"
import { PastEvents } from "@/components/redesign/past-events"
import { SiteFooter } from "@/components/redesign/site-footer"
import { getPublishedExperienceBySlug } from "@/lib/experiences/queries"
import {
  getPastSessions,
  getUpcomingBookableSessions,
  getUpcomingCategorizedSessions,
} from "@/lib/schedule/redesign-content"
import {
  groupByContentCategory,
  toPastEvents,
  toReservationItems,
} from "@/lib/schedule/map-redesign-content"

export default async function Page() {
  const brickwell = await getPublishedExperienceBySlug("brickwell")

  const [categorizedSessions, bookableSessions, pastSessions] = brickwell
    ? await Promise.all([
        getUpcomingCategorizedSessions(brickwell.id),
        getUpcomingBookableSessions(brickwell.id),
        getPastSessions(brickwell.id),
      ])
    : [[], [], []]

  return (
    <LanguageProvider>
      <main>
        <SiteNav />
        <HeroCanvas />
        <Philosophy />
        <Brickwell itemsByCategory={groupByContentCategory(categorizedSessions)} />
        <UpcomingEvents items={toReservationItems(bookableSessions)} />
        <PastEvents events={toPastEvents(pastSessions)} />
        <SiteFooter />
      </main>
    </LanguageProvider>
  )
}
