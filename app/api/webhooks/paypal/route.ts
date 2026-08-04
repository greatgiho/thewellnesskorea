import { NextResponse } from "next/server"
import { verifyWebhookSignature } from "@/lib/payments/paypal"
import {
  finalizePaidBooking,
  releaseDeniedBooking,
} from "@/lib/bookings/finalize-payment"
import { shouldReleaseBooking } from "@/lib/bookings/reconcile-captures"

/**
 * PayPal webhook. Finalizes payments whose capture was PENDING at checkout
 * (e.g. PENDING_REVIEW) once PayPal resolves the review, and frees the seat
 * when one is refunded or denied.
 *
 * Requires PAYPAL_WEBHOOK_ID (from the webhook registered in the PayPal
 * dashboard) — signature verification fails closed without it.
 *
 * ## What the registered webhook should subscribe to
 *
 * Acted on here:
 *   PAYMENT.CAPTURE.COMPLETED   confirm the booking, send the email
 *   PAYMENT.CAPTURE.DENIED      \
 *   PAYMENT.CAPTURE.DECLINED     >  free the seat
 *   PAYMENT.CAPTURE.REVERSED    /
 *   PAYMENT.CAPTURE.REFUNDED    free the seat, if the refund was full
 *
 * Subscribed but not acted on, deliberately:
 *   PAYMENT.CAPTURE.PENDING     a capture entering review
 *
 * That last one is the whole reason this list is written down. The
 * subscription was once trimmed to "only what the code branches on", which
 * dropped PENDING — and with it the record of *when* a capture went under
 * review. That timestamp was the decisive clue when a booking was later found
 * stuck for four weeks, and the trim removed the very evidence that had
 * diagnosed it. Unrecognised events cost nothing: they fall through to
 * `{ ignored: true }` below. A missing record costs an investigation.
 *
 * Anything outside PAYMENT.CAPTURE.* (tokenization, payouts, disputes) has no
 * bearing on this service and stays unsubscribed.
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
      type === "PAYMENT.CAPTURE.REVERSED" ||
      // Waiting for the daily sweep would leave a seat taken for a day after
      // the money went back. The capture is asked rather than the event
      // believed: PayPal sends this for a partial refund too, and a refund
      // event's resource.id is the refund's, not the capture's.
      (type === "PAYMENT.CAPTURE.REFUNDED" &&
        (await shouldReleaseBooking(bookingId)))
    ) {
      await releaseDeniedBooking(bookingId)
    }
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error("[webhook/paypal] handler error:", err)
    return NextResponse.json({ error: "Handler error" }, { status: 500 })
  }
}
