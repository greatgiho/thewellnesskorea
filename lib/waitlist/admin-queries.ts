import { createServiceClient } from "@/lib/supabase/service"

export type WaitlistEntry = {
  id: string
  guestName: string
  guestEmail: string
  guestPhone: string | null
  createdAt: string
  notifiedAt: string | null
}

export async function getWaitlistForSession(sessionId: string): Promise<WaitlistEntry[]> {
  const supabase = createServiceClient()

  const { data, error } = await supabase
    .from("waitlist_entries")
    .select("id, guest_name, guest_email, guest_phone, created_at, notified_at")
    .eq("session_id", sessionId)
    .order("created_at", { ascending: true })

  if (error || !data) return []

  return data.map((row) => ({
    id: row.id as string,
    guestName: row.guest_name as string,
    guestEmail: row.guest_email as string,
    guestPhone: (row.guest_phone as string | null) ?? null,
    createdAt: row.created_at as string,
    notifiedAt: (row.notified_at as string | null) ?? null,
  }))
}

export type SessionWaitlist = {
  sessionId: string
  sessionTitle: string
  startsAt: string
  entries: WaitlistEntry[]
}

/**
 * Returns waitlist entries grouped by session for a date range.
 * Only returns sessions that have at least one un-notified entry.
 */
export async function getWaitlistByDateRange(
  startDateKey: string,
  endDateKeyExclusive: string,
): Promise<SessionWaitlist[]> {
  const supabase = createServiceClient()

  const { data, error } = await supabase
    .from("waitlist_entries")
    .select(
      `
      id,
      guest_name,
      guest_email,
      guest_phone,
      created_at,
      notified_at,
      session:sessions (
        id,
        title,
        starts_at
      )
    `,
    )
    .gte("sessions.starts_at", `${startDateKey}T00:00:00+09:00`)
    .lt("sessions.starts_at", `${endDateKeyExclusive}T00:00:00+09:00`)
    .is("notified_at", null)
    .order("created_at", { ascending: true })

  if (error || !data) return []

  // Group by session
  const map = new Map<string, SessionWaitlist>()

  for (const row of data) {
    const session = Array.isArray(row.session) ? row.session[0] : row.session
    if (!session) continue

    if (!map.has(session.id)) {
      map.set(session.id, {
        sessionId: session.id,
        sessionTitle: session.title,
        startsAt: session.starts_at,
        entries: [],
      })
    }

    map.get(session.id)!.entries.push({
      id: row.id,
      guestName: row.guest_name,
      guestEmail: row.guest_email,
      guestPhone: row.guest_phone ?? null,
      createdAt: row.created_at,
      notifiedAt: row.notified_at ?? null,
    })
  }

  return Array.from(map.values()).sort(
    (a, b) => a.startsAt.localeCompare(b.startsAt),
  )
}
