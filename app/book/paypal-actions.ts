"use server"

import { revalidatePath } from "next/cache"
import { createOrder, captureOrder } from "@/lib/payments/paypal"
import { getPendingBookingPayment } from "@/lib/bookings/payment-queries"
import {
  finalizePaidBooking,
  recordPendingCapture,
} from "@/lib/bookings/finalize-payment"

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

export type CaptureBookingResult =
  | { ok: true; status: "COMPLETED" }
  | { ok: false; pending: true; status: "PENDING" }
  | { ok: false; pending?: false; status: string }

/**
 * Capture an approved PayPal order. Decisions are based on the CAPTURE status,
 * not the order status:
 * - COMPLETED -> confirm the booking + send email.
 * - PENDING   -> money captured but held for review; keep the hold and wait for
 *   the webhook (PAYMENT.CAPTURE.COMPLETED/DENIED) to finalize.
 * - otherwise -> treated as not paid.
 */
export async function captureBookingPaypalOrder(
  bookingId: string,
  orderId: string,
): Promise<CaptureBookingResult> {
  const pending = await getPendingBookingPayment(bookingId)
  if (!pending) throw new Error("Booking not found.")
  if (pending.status === "confirmed") return { ok: true, status: "COMPLETED" }

  const result = await captureOrder(orderId)
  const captureId = result.captureId ?? orderId

  if (result.captureStatus === "COMPLETED") {
    await finalizePaidBooking(bookingId, captureId)
    revalidatePath("/")
    return { ok: true, status: "COMPLETED" }
  }

  if (result.captureStatus === "PENDING") {
    await recordPendingCapture(bookingId, captureId)
    revalidatePath("/")
    return { ok: false, pending: true, status: "PENDING" }
  }

  return { ok: false, status: result.captureStatus ?? result.status ?? "UNKNOWN" }
}
