import { createClient } from "@/lib/supabase/server"
import { createServiceClient } from "@/lib/supabase/service"
import {
  SESSION_SUMMARY_SELECT,
  mapSessionSummary,
  type SessionSummaryRelation,
} from "./session-summary"
import type { BookingStatus } from "./types"

export type MemberBookingPayment = {
  status: string
  amount: number
  currency: string
  provider: string
  merchantUid: string
  pgTid: string | null
}

export type MemberBookingItem = {
  id: string
  status: BookingStatus
  guestName: string
  sessionTitle: string
  sessionStartsAt: string
  sessionEndsAt: string
  floorName: string
  instructorName: string
  payment: MemberBookingPayment | null
}

export async function getMemberBookingsForUser(
  userId: string,
): Promise<MemberBookingItem[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("bookings")
    .select(
      `
      id,
      status,
      guest_name,
      session:sessions (${SESSION_SUMMARY_SELECT}),
      payments (
        status,
        amount,
        currency,
        pg_provider,
        merchant_uid,
        pg_tid
      )
    `,
    )
    .eq("user_id", userId)
    .order("created_at", { ascending: false })

  if (error) throw new Error(error.message)
  if (!data) return []

  return data
    .map((row) => {
      const summary = mapSessionSummary(row.session as SessionSummaryRelation)
      if (!summary) return null

      const paymentsArr = (row.payments ?? []) as Array<{
        status: string
        amount: number | string
        currency: string
        pg_provider: string
        merchant_uid: string
        pg_tid: string | null
      }>
      const pay =
        paymentsArr.find((p) => p.status === "paid") ?? paymentsArr[0] ?? null

      return {
        id: row.id as string,
        status: row.status as BookingStatus,
        guestName: row.guest_name as string,
        sessionTitle: summary.title,
        sessionStartsAt: summary.startsAt,
        sessionEndsAt: summary.endsAt,
        floorName: summary.floorName,
        instructorName: summary.instructorName,
        payment: pay
          ? {
              status: pay.status,
              amount: Number(pay.amount),
              currency: pay.currency,
              provider: pay.pg_provider,
              merchantUid: pay.merchant_uid,
              pgTid: pay.pg_tid,
            }
          : null,
      }
    })
    .filter((item): item is MemberBookingItem => item != null)
}

export async function getMemberProfileForUser(userId: string) {
  // Common member profile now lives in auth.users app_metadata.
  const supabase = createServiceClient()
  const { data, error } = await supabase.auth.admin.getUserById(userId)
  if (error) throw new Error(error.message)

  const meta = data.user?.app_metadata as Record<string, unknown> | undefined
  if (!meta) return null
  return {
    id: userId,
    name: typeof meta.name === "string" ? meta.name : null,
    phone: typeof meta.phone === "string" ? meta.phone : null,
    locale: typeof meta.locale === "string" ? meta.locale : null,
  }
}
