import { createClient } from "@/lib/supabase/client"
import {
  JOURNAL_PHOTOS_BUCKET,
  journalHeroStoragePath,
  journalInlineStoragePath,
  validateJournalPhotoFile,
} from "@/lib/journal/images"
import { extFromMime } from "@/lib/partners/utils"

export async function uploadJournalHero(
  postId: string,
  file: File,
): Promise<string> {
  const validationError = validateJournalPhotoFile(file, {
    invalidType: "Use JPG, PNG, or WebP.",
    tooLarge: "Max file size is 5MB.",
  })
  if (validationError) throw new Error(validationError)

  const supabase = createClient()
  const ext = extFromMime(file.type)
  const path = journalHeroStoragePath(postId, ext)

  const { error } = await supabase.storage
    .from(JOURNAL_PHOTOS_BUCKET)
    .upload(path, file, { upsert: true, contentType: file.type })

  if (error) throw new Error(error.message)
  return path
}

export async function uploadJournalInline(
  postId: string,
  file: File,
): Promise<string> {
  const validationError = validateJournalPhotoFile(file, {
    invalidType: "Use JPG, PNG, or WebP.",
    tooLarge: "Max file size is 5MB.",
  })
  if (validationError) throw new Error(validationError)

  const supabase = createClient()
  const ext = extFromMime(file.type)
  const fileId = crypto.randomUUID()
  const path = journalInlineStoragePath(postId, fileId, ext)

  const { error } = await supabase.storage
    .from(JOURNAL_PHOTOS_BUCKET)
    .upload(path, file, { upsert: false, contentType: file.type })

  if (error) throw new Error(error.message)
  return path
}
