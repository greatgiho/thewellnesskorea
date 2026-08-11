"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { isRedirectError } from "next/dist/client/components/redirect-error"
import { getOptionalMemberSession } from "@/lib/auth/require-session"
import {
  createBookingRpc,
  cancelBookingByTokenRpc,
} from "@/lib/bookings/rpc"
import { createBookingHoldRpc, confirmBookingPaymentRpc } from "@/lib/bookings/hold-rpc"
import { getPendingBookingPayment } from "@/lib/bookings/payment-queries"
import {
  getBookableSession,
  getBookingSummaryById,
  getBookingSummaryByCancelToken,
} from "@/lib/bookings/queries"
import { validateGuestBookingInput } from "@/lib/bookings/validate"
import {
  formatMoney,
  money,
  orderListTotal,
  MAX_PARTY_SIZE,
  type OrderLine,
} from "@/lib/payments/money"
import {
  sendBookingConfirmationEmail,
  sendBookingCancelledEmail,
} from "@/lib/notifications/booking-email"
import { notifyWaitlist } from "@/lib/waitlist/notify"
import { formatBookingDateTime } from "@/lib/bookings/format"
import { couponMessage, quoteBooking } from "@/lib/bookings/quote"

/**
 * The order as the form submitted it, clamped to something sane.
 *
 * Arrives as one JSON field rather than a fan of numbered inputs, because the
 * number of lines is the number of tiers and neither side should be counting
 * form fields to find out. Nothing here trusts the shape of what comes back —
 * the counts are only ever a request, and the booking transaction re-checks
 * every tier and prices from the session row.
 */
function readOrder(formData: FormData): OrderLine[] {
  const raw = String(formData.get("orderLines") ?? "")
  if (!raw) return [{ tierId: null, adults: 1, children: 0 }]

  let parsed: unknown
  try {
    parsed = JSON.parse(raw)
  } catch {
    return []
  }
  if (!Array.isArray(parsed)) return []

  const count = (value: unknown) => {
    const n = Number(value ?? 0)
    return Number.isFinite(n) ? Math.max(0, Math.floor(n)) : 0
  }

  return parsed
    .map((line) => {
      const l = line as Record<string, unknown>
      const tierId = typeof l.tierId === "string" && l.tierId ? l.tierId : null
      return { tierId, adults: count(l.adults), children: count(l.children) }
    })
    .filter((l) => l.adults + l.children > 0)
}

export type GuestBookingState = {
  error?: string
}

export type CancelBookingState = {
  error?: string
}

export async function submitGuestBooking(
  _prev: GuestBookingState,
  formData: FormData,
): Promise<GuestBookingState> {
  try {
    const sessionId = String(formData.get("sessionId") ?? "")
    const guestName = String(formData.get("guestName") ?? "")
    const guestEmail = String(formData.get("guestEmail") ?? "")
    const guestPhone = String(formData.get("guestPhone") ?? "")
    const couponCode = String(formData.get("couponCode") ?? "").trim() || null
    const lines = readOrder(formData)

    validateGuestBookingInput({ guestName, guestEmail, guestPhone })

    const memberSession = await getOptionalMemberSession()
    const memberRole = memberSession?.user.app_metadata?.role
    const userId =
      memberSession && memberRole !== "partner" ? memberSession.userId : null

    const session = await getBookableSession(sessionId)
    if (!session) {
      return { error: "This class is no longer available for booking." }
    }

    if (session.booked_count >= session.capacity) {
      return { error: "This class is full." }
    }

    const size = lines.reduce((n, l) => n + l.adults + l.children, 0)
    if (size < 1) {
      return { error: "Choose at least one person." }
    }
    if (size > MAX_PARTY_SIZE) {
      return {
        error: `Up to ${MAX_PARTY_SIZE} people per booking. Please contact us for a larger group.`,
      }
    }
    if (session.booked_count + size > session.capacity) {
      const left = Math.max(0, session.capacity - session.booked_count)
      return { error: `Only ${left} spots left in this class.` }
    }

    // Only online (PayPal/USD) classes go through the payment step. Free and
    // on-site classes reserve the spot directly — nothing to pay online.
    //
    // The price after discounts decides, not the list price: a coupon or a
    // 100% session discount makes this free, and the hold RPC refuses a
    // zero-amount booking. Ask the database so this agrees with what the
    // booking transaction will compute.
    const quote = await quoteBooking(sessionId, couponCode, guestEmail, lines)
    if (quote.mode === "online") {
      const hold = await createBookingHoldRpc({
        sessionId,
        guestName,
        guestEmail,
        guestPhone: guestPhone || null,
        userId,
        pgProvider: "paypal",
        couponCode,
        lines,
      })

      revalidatePath("/")
      redirect(`/book/pay?booking=${hold.bookingId}`)
    }

    const result = await createBookingRpc({
      sessionId,
      guestName,
      guestEmail,
      guestPhone: guestPhone || null,
      userId,
      couponCode,
      lines,
    })

    const summary = await getBookingSummaryById(result.bookingId)
    if (summary) {
      try {
        await sendBookingConfirmationEmail(summary, result.cancelToken)
      } catch (emailError) {
        console.error("[booking] confirmation email failed:", emailError)
      }
    }

    revalidatePath("/")
    redirect(`/book/confirm?booking=${result.bookingId}`)
  } catch (error) {
    if (isRedirectError(error)) throw error

    const message =
      error instanceof Error
        ? error.message
        : "Something went wrong. Please try again."

    return { error: message }
  }
}

export async function confirmCancelBooking(
  _prev: CancelBookingState,
  formData: FormData,
): Promise<CancelBookingState> {
  try {
    const cancelToken = String(formData.get("cancelToken") ?? "").trim()
    if (!cancelToken) {
      return { error: "Invalid cancellation link." }
    }

    const summaryBefore = await getBookingSummaryByCancelToken(cancelToken)
    if (!summaryBefore) {
      return { error: "This reservation could not be found." }
    }

    if (summaryBefore.status === "cancelled") {
      redirect("/book/cancelled")
    }

    await cancelBookingByTokenRpc(cancelToken)

    try {
      await sendBookingCancelledEmail({
        ...summaryBefore,
        status: "cancelled",
      })
    } catch (emailError) {
      console.error("[booking] cancellation email failed:", emailError)
    }

    // Notify waitlist — fire-and-forget, non-blocking
    const { heading, timeRange } = formatBookingDateTime(
      summaryBefore.sessionStartsAt,
      summaryBefore.sessionEndsAt,
    )
    notifyWaitlist({
      sessionId: summaryBefore.sessionId,
      sessionTitle: summaryBefore.sessionTitle,
      heading,
      timeRange,
    }).catch((err) => console.error("[waitlist] notify failed:", err))

    revalidatePath("/")
    redirect("/book/cancelled")
  } catch (error) {
    if (isRedirectError(error)) throw error

    const message =
      error instanceof Error
        ? error.message
        : "Something went wrong. Please try again."

    return { error: message }
  }
}

/** Local dev only: simulate PG webhook when PAYMENT_DEV_MOCK=true */
export async function devMockConfirmPayment(bookingId: string): Promise<void> {
  if (process.env.NODE_ENV !== "development") {
    throw new Error("Dev mock payment is not available in production.")
  }
  if (process.env.PAYMENT_DEV_MOCK !== "true") {
    throw new Error("Set PAYMENT_DEV_MOCK=true in .env.local to use dev mock payment.")
  }

  const pending = await getPendingBookingPayment(bookingId)
  if (!pending) {
    throw new Error("Booking not found.")
  }
  if (pending.status === "confirmed") {
    redirect(`/book/confirm?booking=${bookingId}`)
  }
  if (pending.status !== "pending_payment") {
    throw new Error("This booking is not awaiting payment.")
  }

  await confirmBookingPaymentRpc(
    pending.merchantUid,
    `dev-mock-${Date.now()}`,
    pending.pgProvider,
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
  redirect(`/book/confirm?booking=${bookingId}`)
}

export type CouponPreview =
  | { ok: true; total: string; discount: string; percentOff: number }
  | { ok: false; message: string }

/**
 * Check a code for the booking form without committing to it. The booking
 * transaction validates again under a lock, so this is presentation only —
 * a code that sells out in between is refused there, not here.
 */
export async function previewCoupon(
  sessionId: string,
  code: string,
  email: string,
  lines: OrderLine[] = [{ tierId: null, adults: 1, children: 0 }],
): Promise<CouponPreview> {
  try {
    const quote = await quoteBooking(sessionId, code, email, lines)
    if (!quote.coupon?.applied) {
      const reason = quote.coupon && !quote.coupon.applied ? quote.coupon.reason : "not_found"
      return { ok: false, message: couponMessage(reason) }
    }
    const listTotal = orderListTotal(quote.priced)
    const percentOff =
      listTotal.amount > 0
        ? Math.round(((listTotal.amount - quote.total.amount) / listTotal.amount) * 100)
        : 0
    return {
      ok: true,
      total: formatMoney(quote.total),
      discount: formatMoney(
        money(quote.total.currency, quote.coupon.discountAmount),
      ),
      percentOff,
    }
  } catch {
    return { ok: false, message: "That code could not be checked." }
  }
}
