import { PersonSection } from "@/components/people/person-section"
import type { PersonCardData } from "@/lib/people/types"

type ArtistsProps = {
  people: PersonCardData[]
}

export function Artists({ people }: ArtistsProps) {
  return (
    <PersonSection
      id="arts"
      title="Artist"
      description="Our spaces are also stages. Gugak, Korean dance, and performances that reinterpret tradition bring wellness its pulse — heung."
      people={people}
      prevLabel="Previous artists"
      nextLabel="Next artists"
      className="bg-background pb-24 lg:pb-32"
      emptyMessage="Artists will appear here once published in the admin."
    />
  )
}
