import { LanguageProvider } from "@/components/language-provider"
import { SiteNav } from "@/components/site-nav"
import { HeroCanvas } from "@/components/hero-canvas"
import { Philosophy } from "@/components/philosophy"
import { Brickwell } from "@/components/brickwell"
import { Reservation } from "@/components/reservation"
import { SiteFooter } from "@/components/site-footer"

export default function Page() {
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
