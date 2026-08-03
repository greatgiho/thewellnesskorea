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

/**
 * Every image bucket allows authenticated writes, so in practice the only way
 * these uploads get refused is a browser client with no session — and storage
 * answers that with raw Postgres row-level-security wording, naming no table
 * and suggesting no action. The pages render from server cookies, so they look
 * signed in right up to the upload.
 */
export const SIGNED_OUT_MESSAGE =
  "Your session has expired. Sign in again and retry."

export function uploadErrorMessage(message: string): string {
  if (message.toLowerCase().includes("row-level security")) {
    return SIGNED_OUT_MESSAGE
  }
  return `Photo upload failed: ${message}`
}

/**
 * Fail before writing when there is no session to write with.
 *
 * Kept out of uploadImage so a caller sending several files pays for one round
 * trip rather than one per file.
 */
export async function assertSignedInForUpload(): Promise<void> {
  const { error } = await createClient().auth.getUser()
  if (error) throw new Error(SIGNED_OUT_MESSAGE)
}

/** Best-effort delete, for callers cleaning up after a failure. */
export async function removeImages(
  bucket: string,
  paths: string[],
): Promise<void> {
  if (paths.length === 0) return
  await createClient().storage.from(bucket).remove(paths)
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

  // Only the storage failure is translated — a validation problem above is
  // already phrased for the person who picked the file.
  if (error) throw new Error(uploadErrorMessage(error.message))
  return path
}
