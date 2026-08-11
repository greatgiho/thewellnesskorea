import { PublicShell } from "@/components/redesign/public-shell"
import { HeroCanvas } from "@/components/redesign/hero-canvas"
import { Philosophy } from "@/components/redesign/philosophy"
import { Paths } from "@/components/redesign/paths"
import { People } from "@/components/redesign/people"
import { Brickwell } from "@/components/redesign/brickwell"
import { UpcomingEvents } from "@/components/redesign/upcoming-events"
import { PastEvents } from "@/components/redesign/past-events"
import { getPublishedExperienceBySlug } from "@/lib/experiences/queries"
import { getPublishedPartners } from "@/lib/partners/queries"
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

/**
 * The homepage, composed once.
 *
 * Both `/` and the `/dev/redesign` preview render this. They used to hold
 * identical copies of the composition and its queries, which is how the preview
 * quietly stopped being a preview of anything.
 *
 * The design original is kept verbatim under design-reference/v0-original —
 * read that before changing the layout of any section here.
 *
 * Everything below the hero is real data. Brickwell reads sessions tagged with
 * content_category (migration 049); until sessions carry that tag the section
 * renders its empty state, because the queries swallow their errors the way the
 * rest of lib/schedule does — an unapplied migration shows as "nothing here"
 * rather than a crash.
 */
export async function RedesignHome() {
  const [brickwell, guides, artists] = await Promise.all([
    getPublishedExperienceBySlug("brickwell"),
    getPublishedPartners("guide"),
    getPublishedPartners("artist"),
  ])

  const [categorizedSessions, bookableSessions, pastSessions] = brickwell
    ? await Promise.all([
        getUpcomingCategorizedSessions(brickwell.id),
        getUpcomingBookableSessions(brickwell.id),
        getPastSessions(brickwell.id),
      ])
    : [[], [], []]

  // Sections alternate plain / muted backgrounds; that banding is what keeps
  // them from reading as one long page. Reordering means re-checking the tones.
  return (
    <PublicShell>
      <main>
        <HeroCanvas />
        <Philosophy />
        <Paths />
        <People guides={guides} artists={artists} />
        <Brickwell itemsByCategory={groupByContentCategory(categorizedSessions)} />
        <UpcomingEvents items={toReservationItems(bookableSessions)} />
        <PastEvents events={toPastEvents(pastSessions)} />
      </main>
    </PublicShell>
  )
}
