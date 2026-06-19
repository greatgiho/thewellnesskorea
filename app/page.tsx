import { Navbar } from "@/components/navbar"
import { HeroCarousel } from "@/components/experiences/hero-carousel"
import { ExperienceHomeProvider } from "@/components/experiences/experience-home-context"
import { Philosophy } from "@/components/philosophy"
import { WhyKorea } from "@/components/why-korea"
import { Paths } from "@/components/paths"
import { Guides } from "@/components/guides"
import { Artists } from "@/components/artists"
import { Schedule } from "@/components/schedule"
import { ClosingCta } from "@/components/closing-cta"
import { Footer } from "@/components/footer"
import { getPublishedPeople } from "@/lib/people/queries"
import { getPublishedExperiences } from "@/lib/experiences/queries"
import { FALLBACK_EXPERIENCES } from "@/lib/experiences/fallback"
import { getPublicScheduleForExperiences } from "@/lib/schedule/public-queries"

export default async function Page() {
  const [guides, artists, experiencesFromDb] = await Promise.all([
    getPublishedPeople("guide"),
    getPublishedPeople("artist"),
    getPublishedExperiences(),
  ])

  const experiences =
    experiencesFromDb.length > 0 ? experiencesFromDb : FALLBACK_EXPERIENCES

  const scheduleExperienceIds = experiences
    .filter((e) => e.schedule_enabled)
    .map((e) => e.id)

  const sessionsByExperience =
    experiencesFromDb.length > 0
      ? await getPublicScheduleForExperiences(scheduleExperienceIds)
      : {}

  return (
    <main className="bg-background max-lg:snap-none snap-y snap-proximity lg:snap-mandatory">
      <Navbar />
      <ExperienceHomeProvider experiences={experiences}>
        <HeroCarousel />
        <Philosophy />
        <WhyKorea />
        <Paths />
        <Guides people={guides} />
        <Artists people={artists} />
        <Schedule sessionsByExperience={sessionsByExperience} />
      </ExperienceHomeProvider>
      <ClosingCta />
      <Footer />
    </main>
  )
}
