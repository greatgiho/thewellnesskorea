import "server-only"

import { createServiceClient } from "@/lib/supabase/service"
import { getCaptureStatus } from "@/lib/payments/paypal"
import { captureOutcome } from "@/lib/payments/capture-status"
import { finalizePaidBooking, releaseDeniedBooking } from "./finalize-payment"

/**
 * Catch up on captures PayPal never told us about.
 *
 * A capture that returns PENDING at checkout means the money is taken but held
 * for review. `recordPendingCapture` clears `expires_at` so the hold-expiry
 * sweep leaves the seat alone — releasing it would take payment and cancel the
 * booking — and the webhook is what finalizes it once the review clears.
 *
 * When that webhook does not arrive, nothing else ever looks. One such booking
 * sat in `pending_payment` for four weeks holding a seat, invisible to
 * everyone. So rather than trust the delivery, ask PayPal what the capture
 * says now. The webhook still handles the fast path; this is the floor under
 * it.
 */

export type ReconcileResult = {
  checked: number
  confirmed: number
  released: number
  waiting: number
  failed: number
}

type PendingRow = {
  id: string
  payments: { pg_tid: string | null }[] | null
}

/**
 * Bookings whose capture is pending review: held with no deadline, and
 * carrying the capture id we need to ask about. A normal hold has the opposite
 * shape — a deadline and no capture id — so it is not picked up here.
 */
async function findPendingCaptures(limit: number): Promise<PendingRow[]> {
  const supabase = createServiceClient()
  const { data, error } = await supabase
    .from("bookings")
    .select("id, payments!inner(pg_tid, status)")
    .eq("status", "pending_payment")
    .is("expires_at", null)
    .eq("payments.status", "pending")
    .not("payments.pg_tid", "is", null)
    .limit(limit)

  if (error) throw new Error(error.message)
  return (data ?? []) as PendingRow[]
}

export async function reconcilePendingCaptures(
  limit = 50,
): Promise<ReconcileResult> {
  const rows = await findPendingCaptures(limit)
  const result: ReconcileResult = {
    checked: rows.length,
    confirmed: 0,
    released: 0,
    waiting: 0,
    failed: 0,
  }

  for (const row of rows) {
    const captureId = row.payments?.[0]?.pg_tid
    if (!captureId) continue

    // One booking's failure must not stop the rest: a capture PayPal cannot
    // find would otherwise strand every booking behind it.
    try {
      const outcome = captureOutcome(await getCaptureStatus(captureId))
      if (outcome === "confirm") {
        await finalizePaidBooking(row.id, captureId)
        result.confirmed++
      } else if (outcome === "release") {
        await releaseDeniedBooking(row.id)
        result.released++
      } else {
        result.waiting++
      }
    } catch (err) {
      result.failed++
      console.error(`[reconcile] booking ${row.id} capture ${captureId}:`, err)
    }
  }

  return result
}
