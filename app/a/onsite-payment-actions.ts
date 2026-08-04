"use server"

import { revalidatePath } from "next/cache"
import { requireAdminSession } from "@/lib/auth/require-session"

export type CollectResult = { ok: true } | { ok: false; error: string }

/**
 * Record that an on-site payment was handed over at the studio, or undo a
 * mistaken entry.
 *
 * Separate from the online capture path: collect_onsite_payment does not
 * expect a pending_payment booking with a live hold, because an on-site
 * booking is confirmed the moment it is made and the money arrives later.
 */
export async function collectOnsitePayment(
  bookingId: string,
  collected: boolean,
): Promise<CollectResult> {
  const { supabase } = await requireAdminSession()

  const { error } = await supabase.rpc("collect_onsite_payment", {
    p_booking_id: bookingId,
    p_collected: collected,
  })

  if (error) return { ok: false, error: error.message }

  revalidatePath("/a/bookings")
  return { ok: true }
}
