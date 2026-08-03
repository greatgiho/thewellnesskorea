import { NextResponse } from "next/server"
import { createServiceClient } from "@/lib/supabase/service"
import { reconcilePendingCaptures } from "@/lib/bookings/reconcile-captures"

/**
 * Vercel cron job — daily at 03:00 (see vercel.json).
 * Secured by CRON_SECRET header set by Vercel.
 *
 * Two sweeps, for the two ways a hold gets stuck:
 * - holds whose payment window ran out, released by the database
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
    try {
      reconciled = await reconcilePendingCaptures()
      console.log("[cron/expire-bookings] Pending captures:", reconciled)
    } catch (err) {
      console.error("[cron/expire-bookings] Capture reconcile failed:", err)
    }

    return NextResponse.json({ expired, reconciled })
  } catch (err) {
    console.error("[cron/expire-bookings] Unexpected error:", err)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
