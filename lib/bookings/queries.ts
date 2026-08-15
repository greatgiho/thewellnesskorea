import { createClient } from "@/lib/supabase/server"
import { createServiceClient } from "@/lib/supabase/service"
import { releaseExpiredHoldsBestEffort } from "./hold-rpc"
import {
  SESSION_SNAPSHOT_SELECT,
  SESSION_SUMMARY_SELECT,
  mapSessionSnapshot,
  mapSessionSummary,
  type SessionSnapshot,
  type SessionSummaryRelation,
} from "./session-summary"
import type {
  PricedMoney,
  SessionPaymentMethod,
} from "@/lib/payments/money"
import { SESSION_WITH_RELATIONS } from "@/lib/schedule/constants"
import { toSessionWithRelations } from "@/lib/schedule/queries"
import type { SessionRelationRow, SessionWithRelations } from "@/lib/schedule/types"
import {
  BOOKING_ITEMS_SELECT,
  partyOf,
  toBookingLines,
  type BookingItemRow,
  type BookingLine,
} from "./lines"
import type { BookingStatus } from "./types"

export type BookingSummary = {
  bookingId: string
  sessionId: string
  guestName: string
  guestEmail: string
  adultCount: number
  childCount: number
  partySize: number
  lines: BookingLine[]
  status: BookingStatus
  sessionTitle: string
  sessionStartsAt: string
  sessionEndsAt: string
  floorName: string
  instructorName: string
  price: PricedMoney
  /** Pay now or pay at the door — the class's own setting, not the currency. */
  paymentMethod: SessionPaymentMethod
  /** Photos and the three description blocks; null when none were filled in. */
  snapshot: SessionSnapshot | null
}

export async function getBookableSession(
  sessionId: string,
): Promise<SessionWithRelations | null> {
  if (
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  ) {
    return null
  }

  // Release expired holds first so this session's spot count is accurate.
  await releaseExpiredHoldsBestEffort()

  const supabase = await createClient()
  const now = new Date().toISOString()

  const { data, error } = await supabase
    .from("sessions")
    .select(SESSION_WITH_RELATIONS)
    .eq("id", sessionId)
    .eq("status", "confirmed")
    .eq("is_published", true)
    .gte("starts_at", now)
    .maybeSingle()

  if (error || !data) return null

  return toSessionWithRelations(
    data as unknown as SessionRelationRow,
  )
}

function toBookingSummary(
  row: {
    id: string
    session_id: string
    guest_name: string
    guest_email: string
    items: BookingItemRow[] | null
    status: BookingStatus
    session: SessionSummaryRelation
  },
): BookingSummary | null {
  const summary = mapSessionSummary(row.session)
  if (!summary) return null

  const lines = toBookingLines(row.items)
  const party = partyOf(lines)

  return {
    bookingId: row.id,
    sessionId: row.session_id,
    guestName: row.guest_name,
    guestEmail: row.guest_email,
    adultCount: party.adults,
    childCount: party.children,
    partySize: party.size,
    lines,
    status: row.status,
    sessionTitle: summary.title,
    sessionStartsAt: summary.startsAt,
    sessionEndsAt: summary.endsAt,
    floorName: summary.floorName,
    instructorName: summary.instructorName,
    price: summary.price,
    paymentMethod: summary.paymentMethod,
    snapshot: mapSessionSnapshot(row.session),
  }
}

export async function getBookingSummaryById(
  bookingId: string,
): Promise<BookingSummary | null> {
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
      session:sessions (${SESSION_SUMMARY_SELECT}, ${SESSION_SNAPSHOT_SELECT})
    `,
    )
    .eq("id", bookingId)
    .maybeSingle()

  if (error || !data) return null
  return toBookingSummary(data as Parameters<typeof toBookingSummary>[0])
}

export async function getBookingSummaryByCancelToken(
  cancelToken: string,
): Promise<BookingSummary | null> {
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
      session:sessions (${SESSION_SUMMARY_SELECT}, ${SESSION_SNAPSHOT_SELECT})
    `,
    )
    .eq("cancel_token", cancelToken.trim())
    .maybeSingle()

  if (error || !data) return null
  return toBookingSummary(data as Parameters<typeof toBookingSummary>[0])
}
