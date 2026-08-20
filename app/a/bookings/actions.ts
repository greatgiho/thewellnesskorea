"use server"

import { revalidatePath } from "next/cache"
import { requireAdminSession } from "@/lib/auth/require-session"
import { refundCapture } from "@/lib/payments/paypal"
import {
  getAdminBookings,
  getAdminSessionList,
  getBookingsForSessionAdmin,
  type AdminBookingsFilter,
  type AdminSessionFilter,
} from "@/lib/bookings/admin-queries"
import { adminCancelBookingWithAdminSession } from "@/lib/bookings/admin-cancel"
import { getBookingSummaryById } from "@/lib/bookings/queries"
import type { BookingStatus } from "@/lib/bookings/types"
import { todayDateKeyInKst, addDaysToDateKey } from "@/lib/schedule/utils"
import { formatBookingDateTime } from "@/lib/bookings/format"
import { notifyWaitlist } from "@/lib/waitlist/notify"
import { asActionResult, type ActionResult } from "@/lib/errors"

function revalidateBookingCaches() {
  revalidatePath("/a/bookings")
  revalidatePath("/a/schedule")
  revalidatePath("/")
  revalidatePath("/u/bookings")
}

export async function fetchSessionBookings(sessionId: string) {
  const { supabase } = await requireAdminSession()
  return getBookingsForSessionAdmin(supabase, sessionId)
}

export async function fetchAdminBookings(
  startDateKey: string,
  endDateKeyInclusive: string,
  status: BookingStatus | "all" = "all",
) {
  const { supabase } = await requireAdminSession()
  const endExclusive = addDaysToDateKey(endDateKeyInclusive, 1)
  const filter: AdminBookingsFilter = {
    startDateKey,
    endDateKeyExclusive: endExclusive,
    status,
  }
  return getAdminBookings(supabase, filter)
}

async function cancelBookingAsAdminCore(bookingId: string): Promise<void> {
  await requireAdminSession()

  // Fetch summary before cancelling so we have session info for waitlist
  const summary = await getBookingSummaryById(bookingId)

  await adminCancelBookingWithAdminSession(bookingId)
  revalidateBookingCaches()

  // Notify waitlist — fire-and-forget
  if (summary) {
    const { heading, timeRange } = formatBookingDateTime(
      summary.sessionStartsAt,
      summary.sessionEndsAt,
    )
    notifyWaitlist({
      sessionId: summary.sessionId,
      sessionTitle: summary.sessionTitle,
      heading,
      timeRange,
    }).catch((err) => console.error("[waitlist] notify failed:", err))
  }
}

export async function fetchAdminSessionList(filter: AdminSessionFilter) {
  const { supabase } = await requireAdminSession()
  return getAdminSessionList(supabase, filter)
}

async function deleteWaitlistEntryAsAdminCore(entryId: string): Promise<void> {
  const { supabase } = await requireAdminSession()
  const { error } = await supabase.rpc("delete_waitlist_entry", {
    p_entry_id: entryId,
  })
  if (error) throw new Error(error.message)
  revalidateBookingCaches()
}

export async function cancelBookingAsAdmin(
  bookingId: string,
): Promise<ActionResult> {
  return asActionResult(
    "cancelBookingAsAdmin",
    "Failed to cancel the booking. Please try again.",
    () => cancelBookingAsAdminCore(bookingId),
  )
}

export async function deleteWaitlistEntryAsAdmin(
  entryId: string,
): Promise<ActionResult> {
  return asActionResult(
    "deleteWaitlistEntryAsAdmin",
    "Failed to remove the waitlist entry. Please try again.",
    () => deleteWaitlistEntryAsAdminCore(entryId),
  )
}

export async function getDefaultBookingsDateRange() {
  const start = todayDateKeyInKst()
  const end = addDaysToDateKey(start, 30)
  return { start, end }
}

/**
 * Give a paid booking's money back, through PayPal's API.
 *
 * The capture id has been on the payment row since it settled
 * (confirm_booking_payment writes pg_tid), so nothing about this needs
 * PayPal's dashboard — which is where it has had to happen until now, leaving
 * our own row saying 'paid' with no record that anything went back.
 *
 * PayPal first, our row second. A refund recorded before PayPal agrees to it
 * is a row claiming money went back that never did, and the only person who
 * would notice is the customer who was told it had.
 *
 * Deliberately does not cancel the booking. Whether somebody keeps their seat
 * is a separate decision from whether they get their money — the same
 * separation cancel_booking_by_token has always kept, from the other side.
 */
async function refundBookingPaymentCore(bookingId: string): Promise<void> {
  const { supabase } = await requireAdminSession()

  const { data, error } = await supabase
    .from("payments")
    .select("id, pg_tid, pg_provider, status")
    .eq("booking_id", bookingId)
    .eq("status", "paid")
    .maybeSingle()

  if (error) throw new Error(error.message)
  if (!data) throw new Error("결제된 내역이 없습니다.")
  if (data.pg_provider !== "paypal") {
    throw new Error("PayPal 결제만 앱에서 환불할 수 있습니다.")
  }
  if (!data.pg_tid) {
    throw new Error("PayPal 거래 번호가 없어 환불할 수 없습니다.")
  }

  const refund = await refundCapture(data.pg_tid as string)

  // Conditional on the row still being paid, so two admins pressing at once
  // cannot both write a refund over one that already happened.
  const { error: updateError } = await supabase
    .from("payments")
    .update({
      status: "refunded",
      cancelled_at: new Date().toISOString(),
      metadata: { refund: { id: refund.refundId, status: refund.status } },
    })
    .eq("id", data.id)
    .eq("status", "paid")

  if (updateError) throw new Error(updateError.message)
  revalidateBookingCaches()
}

export async function refundBookingPayment(
  bookingId: string,
): Promise<ActionResult> {
  return asActionResult(
    "refundBookingPayment",
    "Failed to refund the payment. Please try again.",
    () => refundBookingPaymentCore(bookingId),
  )
}
