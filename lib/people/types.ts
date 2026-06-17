import type { PathKey } from "@/lib/paths/paths-data"

export type PersonKind = "guide" | "artist" | "both"

export type PersonRegistrationStatus =
  | "admin"
  | "draft"
  | "submitted"
  | "approved"
  | "rejected"

export type PersonRow = {
  id: string
  slug: string
  kind: PersonKind
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
  registration_status: PersonRegistrationStatus
  submitted_at: string | null
  reviewed_at: string | null
  reviewed_by: string | null
  rejection_reason: string | null
  created_at: string
  updated_at: string
}

export type PersonProgramRow = {
  id: string
  person_id: string
  title: string
  description: string | null
  path_keys: PathKey[]
  sort_order: number
  created_at: string
}

export type PersonWithPrograms = PersonRow & {
  programs: PersonProgramRow[]
}

export type PersonProgramFormInput = {
  title: string
  description: string
  path_keys: PathKey[]
}

export type PersonFormInput = {
  kind: PersonKind
  name_ko: string
  name_en: string
  role_ko: string
  role_en: string
  quote: string
  phone: string
  email: string
  instagram: string
  is_published: boolean
  programs: PersonProgramFormInput[]
}

export type PersonProgramCard = {
  title: string
  pathKeys: PathKey[]
  pathLabels: string[]
}

export type PersonCardData = {
  id: string
  name: string
  role: string
  image: string
  programs: PersonProgramCard[]
  instagramUrl: string | null
  quote: string | null
}

/** Columns safe for public site — excludes phone and email */
export const PERSON_PUBLIC_COLUMNS =
  "id, slug, kind, name_ko, name_en, role_ko, role_en, quote, photo_path, instagram, sort_order, is_published, created_at, updated_at"

export const PERSON_PROGRAM_COLUMNS =
  "id, person_id, title, description, path_keys, sort_order, created_at"
