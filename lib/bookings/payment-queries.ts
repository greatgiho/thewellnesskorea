import { createServiceClient } from "@/lib/supabase/service"
import {
  BOOKING_ITEMS_SELECT,
  partyOf,
  toBookingLines,
  type BookingItemRow,
} from "./lines"
import {
  SESSION_SUMMARY_SELECT,
  mapSessionSummary,
  type SessionSummaryRelation,
} from "./session-summary"
import type { BookingStatus } from "./types"
import type { BookingSummary } from "./queries"

export type PendingBookingPayment = {
  bookingId: string
  cancelToken: string
  status: BookingStatus
  expiresAt: string | null
  guestName: string
  guestEmail: string
  merchantUid: string
  amount: number
  pgProvider: string
  paymentStatus: "pending" | "paid" | "failed" | "cancelled"
  summary: BookingSummary
}

export async function getPendingBookingPayment(
  bookingId: string,
): Promise<PendingBookingPayment | null> {
  const supabase = createServiceClient()

  const { data, error } = await supabase
    .from("bookings")
    .select(
      `
      id,
      session_id,
      guest_name,
      guest_email,
      ${BOOKING_ITEMS_SELECT},
      status,
      expires_at,
      cancel_token,
      session:sessions (${SESSION_SUMMARY_SELECT}),
      payments (
        merchant_uid,
        amount,
        pg_provider,
        status
      )
    `,
    )
    .eq("id", bookingId)
    .maybeSingle()

  if (error || !data) return null

  const summary = mapSessionSummary(data.session as SessionSummaryRelation)
  if (!summary) return null

  const lines = toBookingLines(data.items as BookingItemRow[] | null)
  const party = partyOf(lines)

  const payments = (data.payments ?? []) as {
    merchant_uid: string
    amount: number
    pg_provider: string
    status: PendingBookingPayment["paymentStatus"]
  }[]
  const payment =
    payments.find((p) => p.status === "pending") ??
    payments.find((p) => p.status === "paid") ??
    payments[0]

  if (!payment) return null

  return {
    bookingId: data.id as string,
    cancelToken: data.cancel_token as string,
    status: data.status as BookingStatus,
    expiresAt: (data.expires_at as string | null) ?? null,
    guestName: data.guest_name as string,
    guestEmail: data.guest_email as string,
    merchantUid: payment.merchant_uid,
    amount: Number(payment.amount),
    pgProvider: payment.pg_provider,
    paymentStatus: payment.status,
    summary: {
      bookingId: data.id as string,
      sessionId: data.session_id as string,
      guestName: data.guest_name as string,
      guestEmail: data.guest_email as string,
      adultCount: party.adults,
      childCount: party.children,
      partySize: party.size,
      lines,
      status: data.status as BookingStatus,
      sessionTitle: summary.title,
      sessionStartsAt: summary.startsAt,
      sessionEndsAt: summary.endsAt,
      floorName: summary.floorName,
      instructorName: summary.instructorName,
      price: summary.price,
      paymentMethod: summary.paymentMethod,
      // The payment screens show money and logistics, not the class write-up,
      // so this select does not pay for it.
      snapshot: null,
    },
  }
}
