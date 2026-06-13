import type { PathKey } from "@/lib/paths/paths-data"

export type SessionDescriptionBlocks = {
  intro: string
  progress: string
  preparation: string
}

export type FloorRow = {
  id: string
  slug: string
  level: number
  name_ko: string
  name_en: string
  sort_order: number
}

export type SessionRow = {
  id: string
  floor_id: string
  instructor_id: string
  person_program_id: string | null
  title: string
  path_keys: PathKey[]
  starts_at: string
  ends_at: string
  capacity: number
  booked_count: number
  is_published: boolean
  image_paths: string[]
  description_blocks: SessionDescriptionBlocks
  created_at: string
  updated_at: string
}

export type SessionWithRelations = SessionRow & {
  floor?: FloorRow
  instructor?: {
    id: string
    name_ko: string
    name_en: string
    role_ko: string
    role_en: string
  }
}

export type SessionFormInput = {
  floor_id: string
  instructor_id: string
  person_program_id: string | null
  title: string
  path_keys: PathKey[]
  date: string
  start_time: string
  end_time: string
  capacity: number
  is_published: boolean
  image_paths: string[]
  description_blocks: SessionDescriptionBlocks
}

export type SlotClickPayload = {
  floorId: string
  time: string
}
