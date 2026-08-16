import "server-only"

import {
  confirmPayment,
  getPaymentByOrderId,
  TossError,
  type TossPayment,
} from "@/lib/payments/toss"
import {
  finalizePaidBooking,
  findBookingByMerchantUid,
  recordPendingCapture,
  releaseDeniedBooking,
} from "@/lib/bookings/finalize-payment"

/**
 * What our side does about a Toss payment, in the one place both callers reach.
 *
 * Two things arrive saying a payment happened — the customer's browser coming
 * back from the payment window, and a webhook from Toss — and either can be
 * first, or only. A virtual account is the clear case: the redirect returns
 * before any money moves, and the deposit lands hours later with no browser
 * anywhere. So this cannot live in the redirect handler.
 *
 * Both paths end in confirm_booking_payment, which is idempotent — an already
 * paid booking returns its id rather than raising — so arriving twice is
 * normal rather than something to guard against.
 */

export type SettlementResult =
  | { ok: true; bookingId: string; status: "paid" }
  | { ok: true; bookingId: string; status: "awaiting_deposit" }
  | { ok: false; reason: string; code?: string; bookingId?: string }

/**
 * Amounts must match exactly, and ours is the one that decides.
 *
 * The amount comes back from the payment window in the query string, where the
 * customer can edit it. Toss refuses a confirm whose amount is not the one it
 * authorised, so a raised number fails there — but a *lowered* one would
 * match Toss and underpay us, and only our own record can catch that.
 */
function amountsAgree(expected: number, claimed: number): boolean {
  return Math.round(expected) === Math.round(claimed)
}

/**
 * Turn an authorisation into a charge. Called from the redirect, once.
 */
export async function settleTossRedirect(input: {
  paymentKey: string
  orderId: string
  amount: number
}): Promise<SettlementResult> {
  const booking = await findBookingByMerchantUid(input.orderId)
  if (!booking) return { ok: false, reason: "주문을 찾을 수 없습니다." }

  if (booking.status === "paid") {
    // Back button, double-click, or a webhook that got here first.
    return { ok: true, bookingId: booking.bookingId, status: "paid" }
  }

  if (!amountsAgree(booking.amount, input.amount)) {
    return {
      ok: false,
      reason: "결제 금액이 주문 금액과 다릅니다.",
      bookingId: booking.bookingId,
    }
  }

  let payment: TossPayment
  try {
    payment = await confirmPayment({
      paymentKey: input.paymentKey,
      orderId: input.orderId,
      // Ours, not the one from the query string. They have just been checked
      // to be equal, and this is the one that came out of the database.
      amount: Math.round(booking.amount),
    })
  } catch (err) {
    if (err instanceof TossError) {
      console.error(`[toss] confirm failed ${err.code}: ${err.message}`)
      return {
        ok: false,
        reason: err.message,
        code: err.code,
        bookingId: booking.bookingId,
      }
    }
    throw err
  }

  return applyTossStatus(payment, booking.bookingId)
}

/**
 * React to whatever state Toss says the payment is in.
 *
 * Shared with the webhook, which is the only thing that ever sees a virtual
 * account go from issued to deposited.
 */
export async function applyTossStatus(
  payment: TossPayment,
  bookingId: string,
): Promise<SettlementResult> {
  switch (payment.status) {
    case "DONE":
      await finalizePaidBooking(bookingId, payment.paymentKey, "toss")
      return { ok: true, bookingId, status: "paid" }

    case "WAITING_FOR_DEPOSIT":
      // A number to transfer to, and nothing paid yet. Record the key and stop
      // the expiry cron from releasing the seat — otherwise the hold lapses
      // while the customer is walking to their banking app, and the deposit
      // arrives for a booking that no longer exists.
      await recordPendingCapture(bookingId, payment.paymentKey, "toss")
      return { ok: true, bookingId, status: "awaiting_deposit" }

    case "CANCELED":
    case "ABORTED":
    case "EXPIRED":
      // The money is gone or never arrived, so the seat goes back and the
      // payment row is marked cancelled with it.
      await releaseDeniedBooking(bookingId)
      return { ok: false, reason: `결제가 완료되지 않았습니다 (${payment.status}).`, bookingId }

    case "PARTIAL_CANCELED":
      // Deliberately does nothing. Part of the money went back, which does not
      // obviously mean the seat should — releasing it in full would take away
      // a place someone still partly paid for, and keeping it silently leaves
      // the books out of step. There is no partial-refund policy to encode
      // yet (see #107), so this asks for a person instead of guessing.
      console.error(
        `[toss] partial cancellation on booking ${bookingId} — seat left in place, needs a decision`,
      )
      return {
        ok: false,
        reason: "부분 취소된 결제입니다. 확인이 필요합니다.",
        bookingId,
      }

    default:
      // READY / IN_PROGRESS: authorised but not settled. Nothing to do — the
      // hold stands and expires on its own if this never progresses.
      return { ok: false, reason: `결제가 아직 완료되지 않았습니다 (${payment.status}).`, bookingId }
  }
}

/**
 * Settle from an order id alone, asking Toss what the truth is.
 *
 * The webhook path. Deliberately does not trust the delivered payload: a
 * webhook body is an unauthenticated POST from the internet, and acting on it
 * directly would let anyone who guesses an order id confirm a booking. The
 * payload is treated as a nudge to go and look.
 */
export async function settleTossByOrderId(
  orderId: string,
): Promise<SettlementResult> {
  const booking = await findBookingByMerchantUid(orderId)
  if (!booking) return { ok: false, reason: "unknown order" }

  let payment: TossPayment
  try {
    payment = await getPaymentByOrderId(orderId)
  } catch (err) {
    if (err instanceof TossError) {
      return { ok: false, reason: err.message, code: err.code }
    }
    throw err
  }

  if (!amountsAgree(booking.amount, payment.totalAmount)) {
    console.error(
      `[toss] webhook amount mismatch on ${orderId}: ours ${booking.amount}, theirs ${payment.totalAmount}`,
    )
    return { ok: false, reason: "amount mismatch", bookingId: booking.bookingId }
  }

  return applyTossStatus(payment, booking.bookingId)
}
