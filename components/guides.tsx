import { PartnerSection } from "@/components/partners/partner-section"
import type { PartnerCardData } from "@/lib/partners/types"

type GuidesProps = {
  partners: PartnerCardData[]
}

export function Guides({ partners }: GuidesProps) {
  return (
    <PartnerSection
      id="guides"
      eyebrow="Our Teachers"
      title="Meet Our Wellness Guides"
      description="A curated group of authentic practitioners dedicated to holding space for your healing journey."
      partners={partners}
      prevLabel="Previous guides"
      nextLabel="Next guides"
      emptyMessage="Wellness guides will appear here once published in the admin."
    />
  )
}
