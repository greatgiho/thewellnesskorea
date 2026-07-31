import type { SupabaseClient } from "@supabase/supabase-js"

export type PartnerSession = {
  id: string
  title: string
  starts_at: string
  ends_at: string
  capacity: number
  booked_count: number
  status: string
  floor: { name_ko: string; level: number } | null
}

export type PartnerBooking = {
  id: string
  guest_name: string
  guest_email: string
  guest_phone: string | null
  status: string
  created_at: string
}

const SESSION_SELECT = `
  id, title, starts_at, ends_at, capacity, booked_count, status,
  floor:floors (name_ko, level)
`

/** 현재 시각 이후 예정된 세션 (최대 20개) */
export async function getUpcomingPartnerSessions(
  supabase: SupabaseClient,
  instructorId: string,
): Promise<PartnerSession[]> {
  const now = new Date().toISOString()
  const { data } = await supabase
    .from("sessions")
    .select(SESSION_SELECT)
    .eq("instructor_id", instructorId)
    .eq("status", "confirmed")
    .gte("starts_at", now)
    .order("starts_at", { ascending: true })
    .limit(20)

  return (data ?? []) as unknown as PartnerSession[]
}

/** 종료된 세션 이력 (최대 50개, 역순) */
export async function getPastPartnerSessions(
  supabase: SupabaseClient,
  instructorId: string,
): Promise<PartnerSession[]> {
  const now = new Date().toISOString()
  const { data } = await supabase
    .from("sessions")
    .select(SESSION_SELECT)
    .eq("instructor_id", instructorId)
    .eq("status", "confirmed")
    .lt("ends_at", now)
    .order("starts_at", { ascending: false })
    .limit(50)

  return (data ?? []) as unknown as PartnerSession[]
}

export type SessionPost = {
  id: string
  author_type: "teacher" | "attendee"
  author_name: string
  content: string
  created_at: string
}

/** 특정 세션의 게시판 글 목록 */
export async function getSessionPosts(
  supabase: SupabaseClient,
  sessionId: string,
): Promise<SessionPost[]> {
  const { data } = await supabase
    .from("session_posts")
    .select("id, author_type, author_name, content, created_at")
    .eq("session_id", sessionId)
    .order("created_at", { ascending: true })

  return (data ?? []) as SessionPost[]
}

/** 특정 세션의 예약자 목록 (confirmed만) */
export async function getSessionBookings(
  supabase: SupabaseClient,
  sessionId: string,
): Promise<PartnerBooking[]> {
  const { data } = await supabase
    .from("bookings")
    .select("id, guest_name, guest_email, guest_phone, status, created_at")
    .eq("session_id", sessionId)
    .eq("status", "confirmed")
    .order("created_at", { ascending: true })

  return (data ?? []) as PartnerBooking[]
}

export type SessionRoster = {
  session: PartnerSession
  attendees: PartnerBooking[]
}

/**
 * Every confirmed session this instructor teaches, each with its attendee list.
 *
 * The per-session page at /p/sessions/[id]/bookings answers "who is coming to
 * this class"; this answers "who is coming to any of my classes" without
 * clicking through each one. Bookings are fetched in a single `in` query
 * rather than one per session, so the cost does not grow with the roster.
 */
export async function getPartnerSessionRosters(
  supabase: SupabaseClient,
  instructorId: string,
): Promise<SessionRoster[]> {
  const { data: sessionRows } = await supabase
    .from("sessions")
    .select(SESSION_SELECT)
    .eq("instructor_id", instructorId)
    .eq("status", "confirmed")
    .order("starts_at", { ascending: false })
    .limit(100)

  const sessions = (sessionRows ?? []) as unknown as PartnerSession[]
  if (sessions.length === 0) return []

  const { data: bookingRows } = await supabase
    .from("bookings")
    .select("id, session_id, guest_name, guest_email, guest_phone, status, created_at")
    .in(
      "session_id",
      sessions.map((session) => session.id),
    )
    .eq("status", "confirmed")
    .order("created_at", { ascending: true })

  const bySession = new Map<string, PartnerBooking[]>()
  for (const row of (bookingRows ?? []) as (PartnerBooking & {
    session_id: string
  })[]) {
    const list = bySession.get(row.session_id) ?? []
    list.push(row)
    bySession.set(row.session_id, list)
  }

  return sessions.map((session) => ({
    session,
    attendees: bySession.get(session.id) ?? [],
  }))
}
