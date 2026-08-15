import { NextResponse, type NextRequest } from "next/server"
import { settleTossByOrderId } from "@/lib/bookings/toss-settlement"
import { isTossConfigured } from "@/lib/payments/toss"

export const dynamic = "force-dynamic"

/**
 * Toss telling us a payment changed state after the customer left.
 *
 * The one path that matters is a virtual account being deposited into: the
 * browser came back hours ago with nothing paid, and this is the only thing
 * that will ever say the money arrived. Cancellations made from the Toss
 * dashboard arrive here too.
 *
 * The body is read for one thing only — which order to go and look at. Every
 * decision is made from what the Toss API says when we ask it directly (see
 * settleTossByOrderId). That is deliberate: this endpoint is an unauthenticated
 * POST from the internet, and Toss's own guidance is to verify by lookup rather
 * than to trust the delivery. Acting on the payload would let anyone who
 * guesses an order id confirm a booking they never paid for.
 *
 * Always 200. A non-2xx makes Toss retry, and the failures worth retrying —
 * their API being down — are not distinguishable here from the ones that will
 * fail identically forever, like an order id that is not ours.
 */
export async function POST(request: NextRequest) {
  if (!isTossConfigured()) {
    return NextResponse.json({ received: true, skipped: "not configured" })
  }

  let orderId: string | undefined
  try {
    const body = (await request.json()) as {
      eventType?: string
      data?: { orderId?: string }
      orderId?: string
    }
    // Newer deliveries nest the payment under `data`; the virtual-account
    // callback puts the order id at the top level.
    orderId = body.data?.orderId ?? body.orderId
  } catch {
    return NextResponse.json({ received: true, skipped: "unreadable body" })
  }

  if (!orderId) {
    return NextResponse.json({ received: true, skipped: "no order id" })
  }

  try {
    const result = await settleTossByOrderId(orderId)
    if (!result.ok) {
      console.error(`[toss-webhook] ${orderId}: ${result.reason}`)
    }
    return NextResponse.json({ received: true })
  } catch (err) {
    console.error("[toss-webhook] failed:", err)
    return NextResponse.json({ received: true, error: true })
  }
}
