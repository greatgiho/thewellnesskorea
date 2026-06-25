import { NextResponse } from "next/server"
import { createServiceClient } from "@/lib/supabase/service"

/**
 * Vercel cron job — expires stale pending_payment bookings.
 * Schedule: every 5 minutes (see vercel.json)
 * Secured by CRON_SECRET header set by Vercel.
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
    return NextResponse.json({ expired })
  } catch (err) {
    console.error("[cron/expire-bookings] Unexpected error:", err)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
