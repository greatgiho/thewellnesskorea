import { notFound } from "next/navigation"
import { LanguageProvider } from "@/components/redesign/language-provider"
import { SiteNav } from "@/components/redesign/site-nav"
import { HeroCanvas } from "@/components/redesign/hero-canvas"
import { Philosophy } from "@/components/redesign/philosophy"
import { Brickwell } from "@/components/redesign/brickwell"
import { Reservation } from "@/components/redesign/reservation"
import { SiteFooter } from "@/components/redesign/site-footer"

// Preview harness for the v0-sourced redesign (components/redesign/*).
// Shown in local dev always; in production mode only when
// ENABLE_DEV_REDESIGN=true. Real Vercel prod leaves the flag unset → 404.
// Mirrors v0-source/app/page.tsx's section order. past-events/programs/
// upcoming-events are ported but, same as in v0-source, not wired here.
// Reservation is UI-only — its submit is a fake setTimeout, no real
// booking/payment backend yet.
function devRedesignEnabled(): boolean {
  return (
    process.env.NODE_ENV !== "production" ||
    process.env.ENABLE_DEV_REDESIGN === "true"
  )
}

export default function DevRedesignPage() {
  if (!devRedesignEnabled()) notFound()

  return (
    <LanguageProvider>
      <main>
        <SiteNav />
        <HeroCanvas />
        <Philosophy />
        <Brickwell />
        <Reservation />
        <SiteFooter />
      </main>
    </LanguageProvider>
  )
}
