import { NextResponse } from "next/server"
import { verifyWebhookSignature } from "@/lib/payments/paypal"
import {
  finalizePaidBooking,
  releaseDeniedBooking,
} from "@/lib/bookings/finalize-payment"

/**
 * PayPal webhook. Finalizes payments whose capture was PENDING at checkout
 * (e.g. PENDING_REVIEW) once PayPal resolves the review.
 *
 * Requires PAYPAL_WEBHOOK_ID (from the webhook registered in the PayPal
 * dashboard) — signature verification fails closed without it.
 */
export async function POST(request: Request) {
  const rawBody = await request.text()

  const verified = await verifyWebhookSignature(
    {
      transmissionId: request.headers.get("paypal-transmission-id") ?? "",
      transmissionTime: request.headers.get("paypal-transmission-time") ?? "",
      certUrl: request.headers.get("paypal-cert-url") ?? "",
      authAlgo: request.headers.get("paypal-auth-algo") ?? "",
      transmissionSig: request.headers.get("paypal-transmission-sig") ?? "",
    },
    rawBody,
  )
  if (!verified) {
    console.warn("[webhook/paypal] signature verification failed")
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 })
  }

  let event: {
    event_type?: string
    resource?: { id?: string; custom_id?: string }
  }
  try {
    event = JSON.parse(rawBody)
  } catch {
    return NextResponse.json({ error: "Bad payload" }, { status: 400 })
  }

  const type = event.event_type
  const captureId = event.resource?.id
  const bookingId = event.resource?.custom_id

  if (!bookingId) {
    // Not a booking capture we can route — acknowledge so PayPal stops retrying.
    return NextResponse.json({ ignored: true })
  }

  try {
    if (type === "PAYMENT.CAPTURE.COMPLETED" && captureId) {
      await finalizePaidBooking(bookingId, captureId)
    } else if (
      type === "PAYMENT.CAPTURE.DENIED" ||
      type === "PAYMENT.CAPTURE.DECLINED" ||
      type === "PAYMENT.CAPTURE.REVERSED"
    ) {
      await releaseDeniedBooking(bookingId)
    }
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error("[webhook/paypal] handler error:", err)
    return NextResponse.json({ error: "Handler error" }, { status: 500 })
  }
}
