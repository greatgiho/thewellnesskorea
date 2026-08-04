"use server"

import { revalidatePath } from "next/cache"
import { requirePartnerSession } from "@/lib/auth/require-partner-session"
import { assertNotViewAs } from "@/lib/view-as-server"

export type PhotoSaveResult = { ok: true } | { ok: false; error: string }

/**
 * Point the caller's partner row at a photo they just uploaded.
 *
 * The upload itself happens in the browser, so this only records where the
 * file went — set_partner_photo re-checks that the path is inside the caller's
 * own folder, and writes nothing but that column.
 *
 * Replacing a .jpg with a .png lands on a different path, so the function
 * hands back what it replaced and the old file goes with it. Best effort: a
 * leftover image is untidy, but failing the save over one would leave the
 * partner staring at a photo they thought they had changed.
 */
export async function savePartnerPhoto(
  photoPath: string,
): Promise<PhotoSaveResult> {
  try {
    await assertNotViewAs()
    const { supabase } = await requirePartnerSession()

    const { data: previous, error } = await supabase.rpc("set_partner_photo", {
      p_photo_path: photoPath,
    })
    if (error) return { ok: false, error: error.message }

    if (previous && previous !== photoPath) {
      const { error: removeError } = await supabase.storage
        .from("person-photos")
        .remove([previous])
      if (removeError) {
        console.error("[partner photo] old file not removed:", removeError)
      }
    }

    revalidatePath("/p/profile")
    // The photo shows on the public partner page and anywhere a card renders.
    revalidatePath("/", "layout")
    return { ok: true }
  } catch {
    return { ok: false, error: "Failed to save the photo." }
  }
}
