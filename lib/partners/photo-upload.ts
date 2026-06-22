import { createClient } from "@/lib/supabase/client"
import { extFromMime, photoStoragePath } from "./utils"

const ALLOWED_PHOTO_TYPES = ["image/jpeg", "image/png", "image/webp"] as const
const MAX_PHOTO_BYTES = 5 * 1024 * 1024

export type PersonPhotoValidationMessages = {
  invalidType: string
  tooLarge: string
}

export function validatePersonPhotoFile(
  file: File,
  messages: PersonPhotoValidationMessages,
): string | null {
  if (!ALLOWED_PHOTO_TYPES.includes(file.type as (typeof ALLOWED_PHOTO_TYPES)[number])) {
    return messages.invalidType
  }
  if (file.size > MAX_PHOTO_BYTES) {
    return messages.tooLarge
  }
  return null
}

export async function uploadPersonPhoto(
  personId: string,
  photo: File,
): Promise<string> {
  const supabase = createClient()
  const ext = extFromMime(photo.type)
  const path = photoStoragePath(personId, ext)

  const { error } = await supabase.storage
    .from("person-photos")
    .upload(path, photo, { upsert: true, contentType: photo.type })

  if (error) throw new Error(error.message)
  return path
}
