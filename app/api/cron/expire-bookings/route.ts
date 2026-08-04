import { NextResponse } from "next/server"
import { createServiceClient } from "@/lib/supabase/service"
import {
  reconcilePendingCaptures,
  reconcileRefundedBookings,
} from "@/lib/bookings/reconcile-captures"

/**
 * Vercel cron job — daily at 03:00 (see vercel.json).
 * Secured by CRON_SECRET header set by Vercel.
 *
 * Three sweeps, for the three ways a seat stays taken when it should not:
 * - holds whose payment window ran out, released by the database
 * - confirmed bookings whose payment was refunded, which no other path hears
 *   about once the booking is past the pending stage
 * - holds whose capture is pending review and whose webhook never arrived,
 *   settled by asking PayPal
 */
export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization")
  const cronSecret = process.env.CRON_SECRET

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const supabase = createServiceClient()
    const { data, error } = await supabase.rpc("expire_stale_booking_holds")

    if (error) {
      console.error("[cron/expire-bookings] RPC error:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    const expired = data as number
    console.log(`[cron/expire-bookings] Expired ${expired} stale holds.`)

    // Separate from the sweep above and allowed to fail on its own: reaching
    // PayPal is the part most likely to break, and it must not cost us the
    // expiry result we already have.
    let reconciled = null
    let refunds = null
    try {
      reconciled = await reconcilePendingCaptures()
      console.log("[cron/expire-bookings] Pending captures:", reconciled)
      // Separate sweep: a booking that was already confirmed is not in the set
      // above, so a refund on one would otherwise never reach us.
      refunds = await reconcileRefundedBookings()
      console.log("[cron/expire-bookings] Refunded bookings:", refunds)
    } catch (err) {
      console.error("[cron/expire-bookings] Capture reconcile failed:", err)
    }

    return NextResponse.json({ expired, reconciled, refunds })
  } catch (err) {
    console.error("[cron/expire-bookings] Unexpected error:", err)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
