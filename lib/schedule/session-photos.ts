import type { createClient } from "@/lib/supabase/server"
import {
  extFromPath,
  SESSION_PHOTOS_BUCKET,
  sessionPhotoStoragePath,
} from "@/lib/schedule/images"

/** Session cover images in storage, kept in step with the row that names them. */

export async function removeSessionPhotos(
  supabase: Awaited<ReturnType<typeof createClient>>,
  paths: string[],
) {
  if (paths.length === 0) return
  await supabase.storage.from(SESSION_PHOTOS_BUCKET).remove(paths)
}

export async function copySessionPhotos(
  supabase: Awaited<ReturnType<typeof createClient>>,
  sourcePaths: string[],
  targetSessionId: string,
): Promise<string[]> {
  const copied: string[] = []

  for (let i = 0; i < sourcePaths.length; i++) {
    const src = sourcePaths[i]
    const ext = extFromPath(src)
    const dest = sessionPhotoStoragePath(targetSessionId, i, ext)

    const { data, error } = await supabase.storage
      .from(SESSION_PHOTOS_BUCKET)
      .download(src)

    if (error || !data) continue

    const { error: uploadError } = await supabase.storage
      .from(SESSION_PHOTOS_BUCKET)
      .upload(dest, data, { upsert: true, contentType: data.type || undefined })

    if (!uploadError) copied.push(dest)
  }

  return copied
}
