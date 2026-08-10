"use server"

import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase/server"
import { assertNotViewAs } from "@/lib/view-as-server"
import { asActionResult, isUserFacingError, type ActionResult } from "@/lib/errors"

export type CheckInState =
  | { ok: true; alreadyCheckedIn: boolean; checkedInAt: string }
  | { ok: false; error: string }

/**
 * Check a ticket in.
 *
 * Runs through the caller's own client rather than the service client:
 * check_in_booking is SECURITY DEFINER and reads auth.uid() and the caller's
 * role to decide whether this booking is theirs to admit. Under the service
 * client there is no caller for it to check.
 *
 * Hand-rolled rather than wrapped in asActionResult, which returns no payload —
 * the door needs to be told whether this ticket had already been used, not just
 * that the call succeeded. Same failure contract: a UserFacingError reaches the
 * screen, anything else is logged and shown as the fallback.
 */
export async function checkInByToken(token: string): Promise<CheckInState> {
  try {
    await assertNotViewAs()
    const supabase = await createClient()
    const { data, error } = await supabase
      .rpc("check_in_booking", { p_token: token })
      .single()

    if (error) throw new Error(error.message)

    const row = data as {
      booking_id: string
      checked_in_at: string
      was_already_checked_in: boolean
    }

    revalidatePath(`/checkin/${token}`)
    revalidatePath(`/t/${token}`)
    return {
      ok: true,
      alreadyCheckedIn: row.was_already_checked_in,
      checkedInAt: row.checked_in_at,
    }
  } catch (error) {
    if (isUserFacingError(error)) return { ok: false, error: error.message }
    console.error("[checkInByToken]", error)
    // The database raises for the cases a person needs to act on — a cancelled
    // booking, a session that is not theirs — so its message is worth showing
    // rather than a generic failure at a door with a queue behind it.
    const message =
      error instanceof Error && error.message
        ? error.message
        : "Could not check this ticket in. Please try again."
    return { ok: false, error: message }
  }
}

/** Undo a mis-scan. */
export async function undoCheckIn(token: string): Promise<ActionResult> {
  return asActionResult(
    "undoCheckIn",
    "Could not undo this check-in. Please try again.",
    async () => {
      await assertNotViewAs()
      const supabase = await createClient()
      const { error } = await supabase.rpc("undo_check_in_booking", {
        p_token: token,
      })
      if (error) throw new Error(error.message)
      revalidatePath(`/checkin/${token}`)
      revalidatePath(`/t/${token}`)
    },
  )
}
