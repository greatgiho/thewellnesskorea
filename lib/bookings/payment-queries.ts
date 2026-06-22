import { createServiceClient } from "@/lib/supabase/service"
import { normalizeRelation } from "@/lib/supabase/normalize-relation"
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
      guest_name,
      guest_email,
      status,
      expires_at,
      cancel_token,
      session:sessions (
        title,
        starts_at,
        ends_at,
        price_krw,
        floor:floors (name_en),
        instructor:partners (name_en)
      ),
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

  const session = normalizeRelation(
    data.session as {
      title: string
      starts_at: string
      ends_at: string
      price_krw: number
      floor?: { name_en: string } | { name_en: string }[] | null
      instructor?: { name_en: string } | { name_en: string }[] | null
    } | {
      title: string
      starts_at: string
      ends_at: string
      price_krw: number
      floor?: { name_en: string } | { name_en: string }[] | null
      instructor?: { name_en: string } | { name_en: string }[] | null
    }[] | null,
  )
  if (!session) return null

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

  const floor = normalizeRelation(session.floor)
  const instructor = normalizeRelation(session.instructor)

  return {
    bookingId: data.id as string,
    cancelToken: data.cancel_token as string,
    status: data.status as BookingStatus,
    expiresAt: (data.expires_at as string | null) ?? null,
    guestName: data.guest_name as string,
    guestEmail: data.guest_email as string,
    merchantUid: payment.merchant_uid,
    amount: payment.amount,
    pgProvider: payment.pg_provider,
    paymentStatus: payment.status,
    summary: {
      bookingId: data.id as string,
      guestName: data.guest_name as string,
      guestEmail: data.guest_email as string,
      status: data.status as BookingStatus,
      sessionTitle: session.title,
      sessionStartsAt: session.starts_at,
      sessionEndsAt: session.ends_at,
      floorName: floor?.name_en ?? "Brickwell",
      instructorName: instructor?.name_en ?? "Wellness Guide",
      priceKrw: session.price_krw ?? 0,
    },
  }
}
