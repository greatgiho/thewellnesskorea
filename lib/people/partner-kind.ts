import type { PersonKind, PersonWithPrograms } from "./types"

export type PartnerKindFilter = "all" | "guide" | "artist" | "brand"

export function partnerKindLabel(kind: PersonKind): string {
  switch (kind) {
    case "guide":
      return "Wellness Guide"
    case "artist":
      return "Artist"
    case "brand":
      return "Brand"
    case "both":
      return "Guide & Artist"
  }
}

export function personMatchesPartnerKind(
  person: Pick<PersonWithPrograms, "kind">,
  filter: PartnerKindFilter,
): boolean {
  if (filter === "all") return true
  if (filter === "guide") {
    return person.kind === "guide" || person.kind === "both"
  }
  if (filter === "artist") {
    return person.kind === "artist" || person.kind === "both"
  }
  return person.kind === "brand"
}
