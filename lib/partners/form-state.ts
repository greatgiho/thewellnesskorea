import type { PartnerFormInput, PartnerWithPrograms } from "./types"
import { activityRegionCodesFromRows } from "@/lib/regions/utils"
import { instagramHandle } from "./utils"

export const emptyPersonInput = (
  overrides?: Partial<PartnerFormInput>,
): PartnerFormInput => ({
  kind: "guide",
  name_ko: "",
  name_en: "",
  role_ko: "",
  role_en: "",
  quote: "",
  phone: "",
  email: "",
  instagram: "",
  is_published: false,
  primary_region_code: "",
  secondary_region_code: "",
  programs: [],
  ...overrides,
})

export function personInputFromPerson(
  person: PartnerWithPrograms,
  overrides?: Partial<PartnerFormInput>,
): PartnerFormInput {
  const { primary, secondary } = activityRegionCodesFromRows(person.activity_regions)
  return {
    kind: person.kind,
    name_ko: person.name_ko,
    name_en: person.name_en,
    role_ko: person.role_ko,
    role_en: person.role_en,
    quote: person.quote ?? "",
    phone: person.phone ?? "",
    email: person.email ?? "",
    instagram: instagramHandle(person.instagram) ?? person.instagram ?? "",
    is_published: person.is_published,
    primary_region_code: primary,
    secondary_region_code: secondary,
    programs: person.programs.map((p) => ({
      id: p.id,
      title: p.title,
      description: p.description ?? "",
      path_keys: p.path_keys ?? [],
    })),
    ...overrides,
  }
}
