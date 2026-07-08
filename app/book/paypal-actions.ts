"use server"

import { revalidatePath } from "next/cache"
import { createOrder, captureOrder } from "@/lib/payments/paypal"
import { getPendingBookingPayment } from "@/lib/bookings/payment-queries"
import { getBookingSummaryById } from "@/lib/bookings/queries"
import { confirmBookingPaymentRpc } from "@/lib/bookings/hold-rpc"
import { sendBookingConfirmationEmail } from "@/lib/notifications/booking-email"

/**
 * Create a PayPal order for a held booking. The held payment row carries the
 * amount + currency; PayPal only supports the (USD) online path.
 */
export async function createBookingPaypalOrder(
  bookingId: string,
): Promise<string> {
  const pending = await getPendingBookingPayment(bookingId)
  if (!pending) throw new Error("Booking not found.")
  if (pending.status === "confirmed") throw new Error("This booking is already paid.")
  if (pending.status !== "pending_payment") {
    throw new Error("This booking is not awaiting payment.")
  }
  if (pending.expiresAt && new Date(pending.expiresAt) <= new Date()) {
    throw new Error("Payment window expired.")
  }

  const currency = pending.summary.priceCurrency
  if (currency !== "USD") {
    throw new Error("Online card payment is only available in USD.")
  }

  const order = await createOrder({
    amount: pending.amount.toFixed(2),
    currency,
    reference: bookingId,
  })
  return order.id
}

export type CaptureBookingResult = { ok: boolean; status: string }

/**
 * Capture an approved PayPal order and, on success, confirm the booking
 * (mark payment paid + booking confirmed) and send the confirmation email.
 */
export async function captureBookingPaypalOrder(
  bookingId: string,
  orderId: string,
): Promise<CaptureBookingResult> {
  const pending = await getPendingBookingPayment(bookingId)
  if (!pending) throw new Error("Booking not found.")
  if (pending.status === "confirmed") return { ok: true, status: "COMPLETED" }

  const result = await captureOrder(orderId)
  if (result.status !== "COMPLETED") {
    return { ok: false, status: result.status }
  }

  await confirmBookingPaymentRpc(
    pending.merchantUid,
    result.captureId ?? orderId,
    "paypal",
    pending.amount,
  )

  const summary = await getBookingSummaryById(bookingId)
  if (summary) {
    try {
      await sendBookingConfirmationEmail(summary, pending.cancelToken)
    } catch (emailError) {
      console.error("[booking] confirmation email failed:", emailError)
    }
  }

  revalidatePath("/")
  return { ok: true, status: result.status }
}
