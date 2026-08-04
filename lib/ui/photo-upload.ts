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
 * Storage refuses a write with raw Postgres row-level-security wording that
 * names no table and suggests no action. Two very different things produce it:
 * a browser client with no session, and a bucket whose policies are missing.
 * Both were seen on 2026-08-03 — the second on a dev project cloned without
 * its storage policies, where an admin who was plainly signed in was told
 * their session had expired.
 *
 * So the wording is chosen by asking who we are, not by assuming.
 */
export const SIGNED_OUT_MESSAGE = "You are signed out. Sign in again and retry."

export const REFUSED_MESSAGE =
  "Storage refused the upload even though you are signed in — the bucket's policies need checking."

export function uploadErrorMessage(message: string, signedIn: boolean): string {
  if (!message.toLowerCase().includes("row-level security")) {
    return `Photo upload failed: ${message}`
  }
  return signedIn ? REFUSED_MESSAGE : SIGNED_OUT_MESSAGE
}

/**
 * Fail before writing when there is no session to write with.
 *
 * getSession reads what is already stored rather than calling out, so a flaky
 * network cannot masquerade as a signed-out user and block an upload that
 * would have worked. The upload itself stays the authority on whether the
 * write is allowed.
 *
 * Kept out of uploadImage so a caller sending several files checks once rather
 * than once per file.
 */
export async function assertSignedInForUpload(): Promise<void> {
  const { data } = await createClient().auth.getSession()
  if (!data.session) throw new Error(SIGNED_OUT_MESSAGE)
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
  // already phrased for the person who picked the file. The session lookup is
  // on the error path alone, and reads what is stored rather than calling out.
  if (error) {
    const { data } = await supabase.auth.getSession()
    throw new Error(uploadErrorMessage(error.message, Boolean(data.session)))
  }
  return path
}
