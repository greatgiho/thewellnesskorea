"use server"

import { revalidatePath } from "next/cache"
import { requireAdminSession } from "@/lib/auth/require-session"
import type { SeatTierInput } from "@/lib/schedule/types"

export type SaveTiersResult = { ok: true } | { ok: false; error: string }

/**
 * Replace a class's seat tiers.
 *
 * Separate from saveSession because tiers hang off a session id, and a new
 * class does not have one until it is written. Sent as a whole list rather
 * than row by row: they are edited as a set, and half-saving would leave a
 * class priced two ways at once.
 *
 * Ownership, the value rules and the "a tier with bookings cannot be removed"
 * rule all live in set_session_tiers, which runs as definer. This surfaces the
 * error and refreshes the screens that show a price.
 */
export async function saveSessionTiers(
  sessionId: string,
  tiers: SeatTierInput[],
): Promise<SaveTiersResult> {
  const { supabase } = await requireAdminSession()

  const { error } = await supabase.rpc("set_session_tiers", {
    p_session_id: sessionId,
    p_tiers: tiers.map((t, index) => ({
      id: t.id ?? null,
      code: t.code.trim(),
      name: t.name?.trim() || null,
      capacity: t.capacity,
      price_amount: t.price_amount,
      child_price_amount: t.child_price_amount,
      sort_order: index,
    })),
  })

  if (error) return { ok: false, error: error.message }

  revalidatePath("/a/schedule")
  revalidatePath("/")
  revalidatePath(`/book/${sessionId}`)
  return { ok: true }
}
