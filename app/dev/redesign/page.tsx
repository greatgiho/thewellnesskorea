import { notFound } from "next/navigation"
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

// Preview harness for the v0-sourced redesign (components/redesign/*).
// Shown in local dev always; in production mode only when
// ENABLE_DEV_REDESIGN=true. Real Vercel prod leaves the flag unset → 404.
//
// Brickwell/UpcomingEvents/PastEvents read the new sessions columns from
// supabase/migrations/043_redesign_content_columns.sql, which is NOT applied
// to any database yet — until it is, these queries harmlessly return []
// (same error-swallowing pattern as the rest of lib/schedule), so every
// section below just renders its empty state.
//
// Programs (components/redesign/programs.tsx) and the original
// Reservation form-panel layout (components/redesign/reservation.tsx) are
// intentionally not imported here: Programs and Reservation both turned out
// to be "list of upcoming classes with a Reserve CTA" — same underlying
// data, two skins — so they were merged into this UpcomingEvents photo-card
// grid instead of keeping three near-duplicate sections. Both files are
// left in place unwired, same as UpcomingEvents was before this merge.
//
// Where/Hours/Contact (previously Reservation's info panel) now lives
// inside Brickwell instead.
//
// Each card links into the existing /book/[sessionId] → pay → confirm flow,
// instead of re-implementing booking/payment.
function devRedesignEnabled(): boolean {
  return (
    process.env.NODE_ENV !== "production" ||
    process.env.ENABLE_DEV_REDESIGN === "true"
  )
}

export default async function DevRedesignPage() {
  if (!devRedesignEnabled()) notFound()

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
