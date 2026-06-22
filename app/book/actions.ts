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
  sendBookingConfirmationEmail,
  sendBookingCancelledEmail,
} from "@/lib/notifications/booking-email"

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

    validateGuestBookingInput({ guestName, guestEmail, guestPhone })

    const memberSession = await getOptionalMemberSession()
    const memberRole = memberSession?.user.app_metadata?.role
    const userId =
      memberSession && memberRole !== "teacher" ? memberSession.userId : null

    const session = await getBookableSession(sessionId)
    if (!session) {
      return { error: "This class is no longer available for booking." }
    }

    if (session.booked_count >= session.capacity) {
      return { error: "This class is full." }
    }

    const priceKrw = session.price_krw ?? 0

    if (priceKrw > 0) {
      const hold = await createBookingHoldRpc({
        sessionId,
        guestName,
        guestEmail,
        guestPhone: guestPhone || null,
        userId,
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
