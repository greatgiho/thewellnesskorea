import { createClient } from "@/lib/supabase/client"

/**
 * One place for "put an image in a bucket".
 *
 * The rule — JPG/PNG/WebP, up to 5MB — was written out three times (partner
 * photos, journal photos, session images) along with three copies of the same
 * upload call. Three copies of a limit is three chances for them to disagree,
 * and a mismatch between the `accept` attribute and the check behind it reads
 * to the user as the upload silently doing nothing.
 */

export const ALLOWED_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
] as const

export const MAX_IMAGE_BYTES = 5 * 1024 * 1024

/** Value for an <input type="file"> accept attribute, from the same list. */
export const IMAGE_ACCEPT = ALLOWED_IMAGE_TYPES.join(",")

export type ImageValidationMessages = {
  invalidType: string
  tooLarge: string
}

export const DEFAULT_IMAGE_MESSAGES: ImageValidationMessages = {
  invalidType: "Use JPG, PNG, or WebP.",
  tooLarge: "Max file size is 5MB.",
}

/** The problem with this file, or null when it is fine. */
export function validateImageFile(
  file: File,
  messages: ImageValidationMessages = DEFAULT_IMAGE_MESSAGES,
): string | null {
  if (!ALLOWED_IMAGE_TYPES.includes(file.type as (typeof ALLOWED_IMAGE_TYPES)[number])) {
    return messages.invalidType
  }
  if (file.size > MAX_IMAGE_BYTES) return messages.tooLarge
  return null
}

/**
 * Upload after validating. Callers decide the bucket and path because those
 * carry meaning per feature; everything else is the same every time.
 *
 * `upsert` is false by default: overwriting is the exception (a hero image
 * replacing itself), not the rule, and a caller that wants it should say so.
 */
export async function uploadImage({
  bucket,
  path,
  file,
  upsert = false,
  messages,
}: {
  bucket: string
  path: string
  file: File
  upsert?: boolean
  messages?: ImageValidationMessages
}): Promise<string> {
  const problem = validateImageFile(file, messages)
  if (problem) throw new Error(problem)

  const supabase = createClient()
  const { error } = await supabase.storage
    .from(bucket)
    .upload(path, file, { upsert, contentType: file.type })

  if (error) throw new Error(error.message)
  return path
}
