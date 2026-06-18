import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { Footer } from "@/components/footer"
import { Navbar } from "@/components/navbar"
import { PersonProfileView } from "@/components/people/person-profile-view"
import { getPublishedPersonBySlug } from "@/lib/people/queries"
import { getRegionsForForms } from "@/lib/regions/queries"
import { getUpcomingSessionsForInstructor } from "@/lib/schedule/queries"

type Props = {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const person = await getPublishedPersonBySlug(slug)

  if (!person) {
    return { title: "Profile — The Wellness Korea" }
  }

  return {
    title: `${person.name_en} — The Wellness Korea`,
    description: `${person.role_en}. ${person.role_ko}`,
  }
}

export default async function PersonProfilePage({ params }: Props) {
  const { slug } = await params
  const person = await getPublishedPersonBySlug(slug)

  if (!person) notFound()

  const sessions = await getUpcomingSessionsForInstructor(person.id)
  const { sido } = await getRegionsForForms()

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main>
        <PersonProfileView person={person} sessions={sessions} sido={sido} />
      </main>
      <Footer />
    </div>
  )
}
