import type { SupabaseClient } from "@supabase/supabase-js"
import { normalizeRelation } from "@/lib/supabase/normalize-relation"
import { kstDayRange } from "@/lib/schedule/utils"
import type { BookingStatus } from "./types"

// ---------------------------------------------------------------------------
// Session-grouped types (for new Bookings admin UI)
// ---------------------------------------------------------------------------

export type AdminSessionSummary = {
  sessionId: string
  sessionTitle: string
  sessionStartsAt: string
  sessionEndsAt: string
  floorName: string
  instructorId: string
  instructorName: string
  capacity: number
  bookedCount: number
  confirmedCount: number   // actual confirmed bookings (excluding pending/cancelled)
  waitlistCount: number
}

export type AdminSessionFilter = {
  startDateKey: string
  endDateKeyExclusive: string
  instructorId?: string   // filter by instructor
  titleSearch?: string    // session title text search
  guestSearch?: string    // guest name / email / phone search
}

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

// ---------------------------------------------------------------------------
// getAdminSessionList — sessions grouped with booking/waitlist counts
// ---------------------------------------------------------------------------

export async function getAdminSessionList(
  supabase: SupabaseClient,
  filter: AdminSessionFilter,
): Promise<AdminSessionSummary[]> {
  const { start } = kstDayRange(filter.startDateKey)
  const { start: end } = kstDayRange(filter.endDateKeyExclusive)

  // 1. Fetch sessions in range
  let sessionsQuery = supabase
    .from("sessions")
    .select(
      `
      id,
      title,
      starts_at,
      ends_at,
      capacity,
      booked_count,
      instructor_id,
      floor:floors (name_en),
      instructor:partners (id, name_en)
    `,
    )
    .gte("starts_at", start)
    .lt("starts_at", end)
    .order("starts_at", { ascending: true })

  if (filter.instructorId) {
    sessionsQuery = sessionsQuery.eq("instructor_id", filter.instructorId)
  }

  if (filter.titleSearch?.trim()) {
    sessionsQuery = sessionsQuery.ilike("title", `%${filter.titleSearch.trim()}%`)
  }

  const { data: sessionRows, error: sessionsError } = await sessionsQuery
  if (sessionsError) throw new Error(sessionsError.message)
  if (!sessionRows || sessionRows.length === 0) return []

  let sessionIds = sessionRows.map((s) => s.id as string)

  // 2. If guest search — filter to sessions that have a matching booking
  if (filter.guestSearch?.trim()) {
    const q = filter.guestSearch.trim()
    const { data: matchingBookings, error: bErr } = await supabase
      .from("bookings")
      .select("session_id")
      .in("session_id", sessionIds)
      .eq("status", "confirmed")
      .or(`guest_name.ilike.%${q}%,guest_email.ilike.%${q}%,guest_phone.ilike.%${q}%`)

    if (bErr) throw new Error(bErr.message)
    const matchedIds = new Set((matchingBookings ?? []).map((b) => b.session_id as string))
    sessionIds = sessionIds.filter((id) => matchedIds.has(id))
    if (sessionIds.length === 0) return []
  }

  // 3. Get confirmed booking counts per session
  const { data: bookingCounts, error: bcErr } = await supabase
    .from("bookings")
    .select("session_id")
    .in("session_id", sessionIds)
    .eq("status", "confirmed")

  if (bcErr) throw new Error(bcErr.message)

  const confirmedBySession = new Map<string, number>()
  for (const b of bookingCounts ?? []) {
    const sid = b.session_id as string
    confirmedBySession.set(sid, (confirmedBySession.get(sid) ?? 0) + 1)
  }

  // 4. Get waitlist counts per session (un-notified only)
  const { data: waitlistCounts, error: wcErr } = await supabase
    .from("waitlist_entries")
    .select("session_id")
    .in("session_id", sessionIds)
    .is("notified_at", null)

  if (wcErr) throw new Error(wcErr.message)

  const waitlistBySession = new Map<string, number>()
  for (const w of waitlistCounts ?? []) {
    const sid = w.session_id as string
    waitlistBySession.set(sid, (waitlistBySession.get(sid) ?? 0) + 1)
  }

  // 5. Map to summary, filtering to matched sessionIds set
  const idSet = new Set(sessionIds)
  return sessionRows
    .filter((s) => idSet.has(s.id as string))
    .map((s) => {
      const floor = normalizeRelation(s.floor as { name_en: string } | { name_en: string }[] | null)
      const instructor = normalizeRelation(s.instructor as { id: string; name_en: string } | { id: string; name_en: string }[] | null)
      return {
        sessionId: s.id as string,
        sessionTitle: s.title as string,
        sessionStartsAt: s.starts_at as string,
        sessionEndsAt: s.ends_at as string,
        floorName: floor?.name_en ?? "—",
        instructorId: instructor?.id ?? (s.instructor_id as string),
        instructorName: instructor?.name_en ?? "—",
        capacity: s.capacity as number,
        bookedCount: s.booked_count as number,
        confirmedCount: confirmedBySession.get(s.id as string) ?? 0,
        waitlistCount: waitlistBySession.get(s.id as string) ?? 0,
      }
    })
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
