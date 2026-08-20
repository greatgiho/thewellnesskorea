import "server-only"

import { createServiceClient } from "@/lib/supabase/service"
import { confirmBookingPaymentRpc } from "@/lib/bookings/hold-rpc"
import { cancelBookingByTokenRpc } from "@/lib/bookings/rpc"
import { getBookingSummaryById } from "@/lib/bookings/queries"
import { sendBookingConfirmationEmail } from "@/lib/notifications/booking-email"
import type { Payer } from "@/lib/payments/payer"

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
 *
 * `payer` is what PayPal returned about the buyer. Optional because the
 * webhook path does not have it — that event carries the capture, not the
 * checkout — so a booking finalised by webhook simply records nothing, which
 * is the same as before.
 */
export async function finalizePaidBooking(
  bookingId: string,
  captureId: string,
  provider: string = "paypal",
  payer?: Payer,
): Promise<boolean> {
  const info = await loadBookingPayment(bookingId)
  if (!info) return false

  await confirmBookingPaymentRpc(info.merchantUid, captureId, provider, info.amount)

  // Who paid, as far as PayPal would say — written after the RPC rather than
  // through it, because confirm_booking_payment is the one that decides
  // whether the money counts and it should not also be deciding what we know
  // about the buyer. Best-effort for the same reason: a booking that is paid
  // and confirmed must not come apart because a name could not be recorded.
  if (payer && Object.keys(payer).length > 0) {
    const { error } = await createServiceClient()
      .from("payments")
      .update({ metadata: { payer } })
      .eq("merchant_uid", info.merchantUid)
    if (error) console.error("[booking] recording the payer failed:", error.message)
  }

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
  provider: string = "paypal",
): Promise<void> {
  const service = createServiceClient()
  const info = await loadBookingPayment(bookingId)
  if (info) {
    await service
      .from("payments")
      .update({ pg_tid: captureId, pg_provider: provider })
      .eq("merchant_uid", info.merchantUid)
  }
  await service.from("bookings").update({ expires_at: null }).eq("id", bookingId)
}

/**
 * The booking a Toss order id belongs to.
 *
 * Toss hands back our merchant_uid as its orderId, and both the return from
 * the payment window and the webhook identify the payment that way — neither
 * knows our booking id. Read with the service client because neither arrives
 * with a session: one is a redirect the customer may not be signed in for, the
 * other is a server calling us.
 */
export async function findBookingByMerchantUid(
  merchantUid: string,
): Promise<{ bookingId: string; amount: number; status: string } | null> {
  const service = createServiceClient()
  const { data } = await service
    .from("payments")
    .select("booking_id, amount, status")
    .eq("merchant_uid", merchantUid)
    .maybeSingle<{ booking_id: string; amount: number | string; status: string }>()
  if (!data) return null
  return {
    bookingId: data.booking_id,
    amount: Number(data.amount),
    status: data.status,
  }
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

  // cancel_booking_by_token releases the seat and marks the booking cancelled,
  // and stops there — it was written for a customer cancelling their own
  // reservation, where whether money goes back is a separate decision.
  //
  // Here it is not separate: we are reacting to the money already having gone
  // back. Leaving the payment row reading 'paid' would put the refund nowhere
  // — the admin list would show a cancelled booking that was paid for, and any
  // reconciliation against Toss would disagree about the day's takings.
  const service = createServiceClient()
  const { error } = await service
    .from("payments")
    .update({ status: "cancelled", cancelled_at: new Date().toISOString() })
    .eq("merchant_uid", info.merchantUid)
    .neq("status", "cancelled")

  if (error) {
    console.error("[booking] marking payment cancelled failed:", error.message)
  }
}
