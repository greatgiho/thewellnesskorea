import {
  JOURNAL_PHOTOS_BUCKET,
  journalHeroStoragePath,
  journalInlineStoragePath,
} from "@/lib/journal/images"
import { extFromMime } from "@/lib/partners/utils"
import { uploadImage } from "@/lib/ui/photo-upload"

export async function uploadJournalHero(
  postId: string,
  file: File,
): Promise<string> {
  // upsert: one hero per post, replacing it reuses the path.
  return uploadImage({
    bucket: JOURNAL_PHOTOS_BUCKET,
    path: journalHeroStoragePath(postId, extFromMime(file.type)),
    file,
    upsert: true,
  })
}

export async function uploadJournalInline(
  postId: string,
  file: File,
): Promise<string> {
  // Inline images accumulate, so each gets its own id and must not overwrite.
  return uploadImage({
    bucket: JOURNAL_PHOTOS_BUCKET,
    path: journalInlineStoragePath(postId, crypto.randomUUID(), extFromMime(file.type)),
    file,
  })
}
