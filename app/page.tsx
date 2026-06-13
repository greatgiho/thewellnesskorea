import { Navbar } from "@/components/navbar"
import { Hero } from "@/components/hero"
import { Philosophy } from "@/components/philosophy"
import { WhyKorea } from "@/components/why-korea"
import { Paths } from "@/components/paths"
import { Guides } from "@/components/guides"
import { Artists } from "@/components/artists"
import { Schedule } from "@/components/schedule"
import { ClosingCta } from "@/components/closing-cta"
import { Footer } from "@/components/footer"
import { getPublishedPeople } from "@/lib/people/queries"

export default async function Page() {
  const [guides, artists] = await Promise.all([
    getPublishedPeople("guide"),
    getPublishedPeople("artist"),
  ])

  return (
    <main className="min-h-screen bg-background">
      <Navbar />
      <Hero />
      <Philosophy />
      <WhyKorea />
      <Paths />
      <Guides people={guides} />
      <Artists people={artists} />
      <Schedule />
      <ClosingCta />
      <Footer />
    </main>
  )
}
