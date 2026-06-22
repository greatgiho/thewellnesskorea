import type { SupabaseClient } from "@supabase/supabase-js"
import { normalizeRelation } from "@/lib/supabase/normalize-relation"
import { kstDayRange } from "@/lib/schedule/utils"
import type { BookingStatus } from "./types"

export type AdminBookingItem = {
  id: string
  sessionId: string
  guestName: string
  guestEmail: string
  guestPhone: string | null
  status: BookingStatus
  cancelledAt: string | null
  createdAt: string
  userId: string | null
  sessionTitle: string
  sessionStartsAt: string
  sessionEndsAt: string
  floorName: string
  instructorName: string
}

type BookingQueryRow = {
  id: string
  session_id: string
  user_id: string | null
  guest_name: string
  guest_email: string
  guest_phone: string | null
  status: BookingStatus
  cancelled_at: string | null
  created_at: string
  session:
    | {
        title: string
        starts_at: string
        ends_at: string
        floor?: { name_en: string } | { name_en: string }[] | null
        instructor?: { name_en: string } | { name_en: string }[] | null
      }
    | {
        title: string
        starts_at: string
        ends_at: string
        floor?: { name_en: string } | { name_en: string }[] | null
        instructor?: { name_en: string } | { name_en: string }[] | null
      }[]
    | null
}

const BOOKING_WITH_SESSION = `
  id,
  session_id,
  user_id,
  guest_name,
  guest_email,
  guest_phone,
  status,
  cancelled_at,
  created_at,
  session:sessions (
    title,
    starts_at,
    ends_at,
    floor:floors (name_en),
    instructor:partners (name_en)
  )
`

function mapAdminBookingRow(row: BookingQueryRow): AdminBookingItem | null {
  const session = normalizeRelation(row.session)
  if (!session) return null

  const floor = normalizeRelation(session.floor)
  const instructor = normalizeRelation(session.instructor)

  return {
    id: row.id,
    sessionId: row.session_id,
    guestName: row.guest_name,
    guestEmail: row.guest_email,
    guestPhone: row.guest_phone,
    status: row.status,
    cancelledAt: row.cancelled_at,
    createdAt: row.created_at,
    userId: row.user_id,
    sessionTitle: session.title,
    sessionStartsAt: session.starts_at,
    sessionEndsAt: session.ends_at,
    floorName: floor?.name_en ?? "—",
    instructorName: instructor?.name_en ?? "—",
  }
}

export async function getBookingsForSessionAdmin(
  supabase: SupabaseClient,
  sessionId: string,
): Promise<AdminBookingItem[]> {
  const { data, error } = await supabase
    .from("bookings")
    .select(BOOKING_WITH_SESSION)
    .eq("session_id", sessionId)
    .order("created_at", { ascending: true })

  if (error) throw new Error(error.message)
  if (!data) return []

  return data
    .map((row) => mapAdminBookingRow(row as BookingQueryRow))
    .filter((item): item is AdminBookingItem => item != null)
}

export type AdminBookingsFilter = {
  startDateKey: string
  endDateKeyExclusive: string
  status?: BookingStatus | "all"
}

export async function getAdminBookings(
  supabase: SupabaseClient,
  filter: AdminBookingsFilter,
): Promise<AdminBookingItem[]> {
  const { start } = kstDayRange(filter.startDateKey)
  const { start: end } = kstDayRange(filter.endDateKeyExclusive)

  const { data: sessions, error: sessionsError } = await supabase
    .from("sessions")
    .select("id")
    .gte("starts_at", start)
    .lt("starts_at", end)

  if (sessionsError) throw new Error(sessionsError.message)
  const sessionIds = (sessions ?? []).map((row) => row.id as string)
  if (sessionIds.length === 0) return []

  const { data, error } = await supabase
    .from("bookings")
    .select(BOOKING_WITH_SESSION)
    .in("session_id", sessionIds)
    .order("created_at", { ascending: false })

  if (error) throw new Error(error.message)
  if (!data) return []

  let items = data
    .map((row) => mapAdminBookingRow(row as BookingQueryRow))
    .filter((item): item is AdminBookingItem => item != null)

  if (filter.status && filter.status !== "all") {
    items = items.filter((item) => item.status === filter.status)
  }

  items.sort((a, b) => {
    const bySession = a.sessionStartsAt.localeCompare(b.sessionStartsAt)
    if (bySession !== 0) return bySession
    return b.createdAt.localeCompare(a.createdAt)
  })

  return items
}
