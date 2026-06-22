import { PartnerSection } from "@/components/partners/partner-section"
import type { PartnerCardData } from "@/lib/partners/types"

type ArtistsProps = {
  partners: PartnerCardData[]
}

export function Artists({ partners }: ArtistsProps) {
  return (
    <PartnerSection
      id="arts"
      title="Artist"
      description="Our spaces are also stages. Gugak, Korean dance, and performances that reinterpret tradition bring wellness its pulse — heung."
      partners={partners}
      prevLabel="Previous artists"
      nextLabel="Next artists"
      className="bg-background pb-24 lg:pb-32"
      emptyMessage="Artists will appear here once published in the admin."
    />
  )
}
