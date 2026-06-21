import { extFromMime } from "@/lib/people/utils"

export const JOURNAL_PHOTOS_BUCKET = "journal-photos"

export function getJournalPhotoUrl(path: string | null | undefined): string {
  if (!path) return "/placeholder.svg"
  if (path.startsWith("/")) return path
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL
  if (!base) return "/placeholder.svg"
  return `${base}/storage/v1/object/public/${JOURNAL_PHOTOS_BUCKET}/${path}`
}

export function journalHeroStoragePath(postId: string, ext: string): string {
  return `${postId}/hero.${ext}`
}

export function journalInlineStoragePath(
  postId: string,
  fileId: string,
  ext: string,
): string {
  return `${postId}/inline/${fileId}.${ext}`
}

export function extFromPath(path: string): string {
  const part = path.split(".").pop()
  return part && part.length <= 4 ? part : "jpg"
}

export function validateJournalPhotoFile(
  file: File,
  messages: { invalidType: string; tooLarge: string },
): string | null {
  if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
    return messages.invalidType
  }
  if (file.size > 5 * 1024 * 1024) return messages.tooLarge
  return null
}
