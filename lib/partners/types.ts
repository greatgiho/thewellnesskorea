import type { PathKey } from "@/lib/paths/paths-data"
import type { PartnerActivityRegionRow } from "@/lib/regions/types"

export type PartnerKind = "guide" | "artist" | "both" | "brand"

export type PartnerRegistrationStatus =
  | "admin"
  | "draft"
  | "submitted"
  | "approved"
  | "rejected"

export type PartnerRow = {
  id: string
  slug: string
  kind: PartnerKind
  name_ko: string
  name_en: string
  role_ko: string
  role_en: string
  quote: string | null
  modalities: string[]
  photo_path: string | null
  phone: string | null
  email: string | null
  instagram: string | null
  sort_order: number
  is_published: boolean
  user_id: string | null
  registration_status: PartnerRegistrationStatus
  submitted_at: string | null
  reviewed_at: string | null
  reviewed_by: string | null
  rejection_reason: string | null
  created_at: string
  updated_at: string
}

export type PartnerProgramRow = {
  id: string
  partner_id: string
  title: string
  description: string | null
  path_keys: PathKey[]
  sort_order: number
  created_at: string
}

export type PartnerWithPrograms = PartnerRow & {
  programs: PartnerProgramRow[]
  activity_regions?: PartnerActivityRegionRow[]
}

export type PartnerProgramFormInput = {
  id?: string
  clientKey?: string
  title: string
  description: string
  path_keys: PathKey[]
}

export type PartnerFormInput = {
  kind: PartnerKind
  name_ko: string
  name_en: string
  role_ko: string
  role_en: string
  quote: string
  phone: string
  email: string
  instagram: string
  is_published: boolean
  primary_region_code: string
  secondary_region_code: string
  programs: PartnerProgramFormInput[]
}

export type PartnerProgramCard = {
  title: string
  pathKeys: PathKey[]
  pathLabels: string[]
}

export type PartnerCardData = {
  id: string
  slug: string
  name: string
  role: string
  image: string
  programs: PartnerProgramCard[]
  instagramUrl: string | null
  quote: string | null
  primaryRegionLabel: string | null
}

export const PARTNER_ACTIVITY_REGIONS_SELECT = `
  partner_activity_regions (
    priority,
    region_code,
    region:regions (code, parent_code, level, name_ko, name_en, sort_order)
  )
`

/** Columns safe for public site — excludes phone and email */
export const PARTNER_PUBLIC_COLUMNS =
  "id, slug, kind, name_ko, name_en, role_ko, role_en, quote, photo_path, instagram, sort_order, is_published, created_at, updated_at"

export const PARTNER_PROGRAM_COLUMNS =
  "id, partner_id, title, description, path_keys, sort_order, created_at"
