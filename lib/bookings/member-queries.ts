import { createClient } from "@/lib/supabase/server"
import { normalizeRelation } from "@/lib/supabase/normalize-relation"
import type { BookingStatus } from "./types"

export type MemberBookingItem = {
  id: string
  status: BookingStatus
  guestName: string
  sessionTitle: string
  sessionStartsAt: string
  sessionEndsAt: string
  floorName: string
  instructorName: string
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
      session:sessions (
        title,
        starts_at,
        ends_at,
        floor:floors (name_en),
        instructor:people (name_en)
      )
    `,
    )
    .eq("user_id", userId)
    .order("created_at", { ascending: false })

  if (error) throw new Error(error.message)
  if (!data) return []

  return data
    .map((row) => {
      const session = normalizeRelation(
        row.session as
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
          | null,
      )
      if (!session) return null

      const floor = normalizeRelation(session.floor)
      const instructor = normalizeRelation(session.instructor)

      return {
        id: row.id as string,
        status: row.status as BookingStatus,
        guestName: row.guest_name as string,
        sessionTitle: session.title,
        sessionStartsAt: session.starts_at,
        sessionEndsAt: session.ends_at,
        floorName: floor?.name_en ?? "Brickwell",
        instructorName: instructor?.name_en ?? "Wellness Guide",
      }
    })
    .filter((item): item is MemberBookingItem => item != null)
}

export async function getMemberProfileForUser(userId: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("members")
    .select("id, name, phone, locale")
    .eq("id", userId)
    .maybeSingle()

  if (error) throw new Error(error.message)
  return data
}
