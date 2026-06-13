import { PersonSection } from "@/components/people/person-section"
import type { PersonCardData } from "@/lib/people/types"

type GuidesProps = {
  people: PersonCardData[]
}

export function Guides({ people }: GuidesProps) {
  return (
    <PersonSection
      id="guides"
      eyebrow="Our Teachers"
      title="Meet Our Wellness Guides"
      description="A curated group of authentic practitioners dedicated to holding space for your healing journey."
      people={people}
      prevLabel="Previous guides"
      nextLabel="Next guides"
      emptyMessage="Wellness guides will appear here once published in the admin."
    />
  )
}
