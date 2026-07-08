import "server-only"

import { createServiceClient } from "@/lib/supabase/service"
import { confirmBookingPaymentRpc } from "@/lib/bookings/hold-rpc"
import { cancelBookingByTokenRpc } from "@/lib/bookings/rpc"
import { getBookingSummaryById } from "@/lib/bookings/queries"
import { sendBookingConfirmationEmail } from "@/lib/notifications/booking-email"

type BookingPaymentRow = {
  cancel_token: string
  payments: { merchant_uid: string; amount: number | string; status: string }[] | null
}

async function loadBookingPayment(
  bookingId: string,
): Promise<{ cancelToken: string; merchantUid: string; amount: number } | null> {
  const service = createServiceClient()
  const { data } = await service
    .from("bookings")
    .select("cancel_token, payments (merchant_uid, amount, status)")
    .eq("id", bookingId)
    .maybeSingle<BookingPaymentRow>()
  if (!data) return null
  const payment = (data.payments ?? [])[0]
  if (!payment) return null
  return {
    cancelToken: data.cancel_token,
    merchantUid: payment.merchant_uid,
    amount: Number(payment.amount),
  }
}

/**
 * A capture COMPLETED — confirm the booking (idempotent) and send the
 * confirmation email. Used by both the capture action and the webhook.
 */
export async function finalizePaidBooking(
  bookingId: string,
  captureId: string,
): Promise<boolean> {
  const info = await loadBookingPayment(bookingId)
  if (!info) return false

  await confirmBookingPaymentRpc(info.merchantUid, captureId, "paypal", info.amount)

  const summary = await getBookingSummaryById(bookingId)
  if (summary) {
    try {
      await sendBookingConfirmationEmail(summary, info.cancelToken)
    } catch (emailError) {
      console.error("[booking] confirmation email failed:", emailError)
    }
  }
  return true
}

/**
 * A capture is PENDING (e.g. PENDING_REVIEW) — money is captured but held.
 * Record the capture id and stop the hold-expiry cron from releasing the spot
 * (expires_at = null); the webhook finalizes it once the review clears.
 */
export async function recordPendingCapture(
  bookingId: string,
  captureId: string,
): Promise<void> {
  const service = createServiceClient()
  const info = await loadBookingPayment(bookingId)
  if (info) {
    await service
      .from("payments")
      .update({ pg_tid: captureId })
      .eq("merchant_uid", info.merchantUid)
  }
  await service.from("bookings").update({ expires_at: null }).eq("id", bookingId)
}

/**
 * A capture was DENIED / REVERSED — release the held spot.
 */
export async function releaseDeniedBooking(bookingId: string): Promise<void> {
  const info = await loadBookingPayment(bookingId)
  if (!info) return
  try {
    await cancelBookingByTokenRpc(info.cancelToken)
  } catch (err) {
    console.error("[booking] release after denied capture failed:", err)
  }
}
