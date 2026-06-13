import { pathLabelKo, type PathKey } from "@/lib/paths/paths-data"
import type {
  PersonCardData,
  PersonProgramRow,
  PersonRow,
  PersonWithPrograms,
} from "./types"

export function slugify(nameEn: string): string {
  return nameEn
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
}

export function getPersonPhotoUrl(photoPath: string | null): string {
  if (!photoPath) return "/placeholder.svg"
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL
  if (!base) return "/placeholder.svg"
  return `${base}/storage/v1/object/public/person-photos/${photoPath}`
}

export function normalizeInstagram(input: string): string | null {
  const trimmed = input.trim()
  if (!trimmed) return null
  if (/^https?:\/\//i.test(trimmed)) return trimmed
  const handle = trimmed.replace(/^@/, "").replace(/\//g, "")
  if (!handle) return null
  return `https://instagram.com/${handle}`
}

export function instagramHandle(urlOrHandle: string | null): string | null {
  if (!urlOrHandle) return null
  const trimmed = urlOrHandle.trim()
  if (trimmed.startsWith("@")) return trimmed
  try {
    const url = new URL(trimmed.startsWith("http") ? trimmed : `https://${trimmed}`)
    const parts = url.pathname.split("/").filter(Boolean)
    return parts[0] ? `@${parts[0]}` : null
  } catch {
    return trimmed.startsWith("@") ? trimmed : `@${trimmed}`
  }
}

export function programToCard(program: PersonProgramRow) {
  const pathKeys = (program.path_keys ?? []) as PathKey[]
  return {
    title: program.title,
    pathKeys,
    pathLabels: pathKeys.map(pathLabelKo),
  }
}

export function toPersonCard(
  row: PersonRow,
  programs: PersonProgramRow[] = [],
): PersonCardData {
  const sorted = [...programs].sort((a, b) => a.sort_order - b.sort_order)
  return {
    id: row.id,
    name: row.name_en,
    role: row.role_en,
    image: getPersonPhotoUrl(row.photo_path),
    programs: sorted.map(programToCard),
    instagramUrl: normalizeInstagram(row.instagram ?? ""),
    quote: row.quote,
  }
}

export function modalitiesToPrograms(modalities: string[]): {
  title: string
  description: string
  path_keys: PathKey[]
}[] {
  return modalities.map((title) => ({
    title,
    description: "",
    path_keys: [] as PathKey[],
  }))
}

export function sortPeopleByName<T extends { name_en: string; created_at: string }>(
  people: T[],
): T[] {
  return [...people].sort((a, b) => {
    const byName = a.name_en.localeCompare(b.name_en, "en", { sensitivity: "base" })
    if (byName !== 0) return byName
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  })
}

export function sortPublishedPeople(rows: PersonRow[]): PersonRow[] {
  return sortPeopleByName(rows)
}

export function getInitials(nameEn: string): string {
  return nameEn
    .split(/\s+/)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("")
    .slice(0, 2)
}

export const PERSON_KINDS = [
  { value: "guide" as const, label: "Wellness Guide" },
  { value: "artist" as const, label: "Artist" },
  { value: "both" as const, label: "Guide & Artist" },
]

export function photoStoragePath(personId: string, ext: string): string {
  return `${personId}/profile.${ext}`
}

export function extFromMime(mime: string): string {
  if (mime === "image/jpeg") return "jpg"
  if (mime === "image/png") return "png"
  if (mime === "image/webp") return "webp"
  return "jpg"
}

export function isValidEmail(email: string): boolean {
  if (!email.trim()) return true
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())
}

export type PersonWithProgramsRow = PersonWithPrograms
