import { createClient } from "@/lib/supabase/server"
import { createServiceClient } from "@/lib/supabase/service"
import { normalizeRelation } from "@/lib/supabase/normalize-relation"
import { SESSION_WITH_RELATIONS } from "@/lib/schedule/constants"
import { toSessionWithRelations } from "@/lib/schedule/queries"
import type { FloorRow, SessionRow, SessionWithRelations } from "@/lib/schedule/types"
import type { BookingStatus } from "./types"

export type BookingSummary = {
  bookingId: string
  sessionId: string
  guestName: string
  guestEmail: string
  status: BookingStatus
  sessionTitle: string
  sessionStartsAt: string
  sessionEndsAt: string
  floorName: string
  instructorName: string
  priceKrw: number
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
    data as SessionRow & {
      floor?: FloorRow | FloorRow[] | null
      instructor?: SessionWithRelations["instructor"] | SessionWithRelations["instructor"][] | null
    },
  )
}

function toBookingSummary(
  row: {
    id: string
    session_id: string
    guest_name: string
    guest_email: string
    status: BookingStatus
    session: {
      title: string
      starts_at: string
      ends_at: string
      price_krw?: number
      floor?: { name_en: string } | { name_en: string }[] | null
      instructor?: { name_en: string } | { name_en: string }[] | null
    } | {
      title: string
      starts_at: string
      ends_at: string
      price_krw?: number
      floor?: { name_en: string } | { name_en: string }[] | null
      instructor?: { name_en: string } | { name_en: string }[] | null
    }[] | null
  },
): BookingSummary | null {
  const session = normalizeRelation(row.session)
  if (!session) return null

  const floor = normalizeRelation(session.floor)
  const instructor = normalizeRelation(session.instructor)

  return {
    bookingId: row.id,
    sessionId: row.session_id,
    guestName: row.guest_name,
    guestEmail: row.guest_email,
    status: row.status,
    sessionTitle: session.title,
    sessionStartsAt: session.starts_at,
    sessionEndsAt: session.ends_at,
    floorName: floor?.name_en ?? "Brickwell",
    instructorName: instructor?.name_en ?? "Wellness Guide",
    priceKrw: session.price_krw ?? 0,
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
      status,
      session:sessions (
        title,
        starts_at,
        ends_at,
        price_krw,
        floor:floors (name_en),
        instructor:partners (name_en)
      )
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
      status,
      session:sessions (
        title,
        starts_at,
        ends_at,
        price_krw,
        floor:floors (name_en),
        instructor:partners (name_en)
      )
    `,
    )
    .eq("cancel_token", cancelToken.trim())
    .maybeSingle()

  if (error || !data) return null
  return toBookingSummary(data as Parameters<typeof toBookingSummary>[0])
}
