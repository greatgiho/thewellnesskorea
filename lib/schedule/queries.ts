import { createClient } from "@/lib/supabase/server"
import { normalizeRelation } from "@/lib/supabase/normalize-relation"
import { normalizeDescriptionBlocks } from "./images"
import { SESSION_WITH_RELATIONS } from "./constants"
import type { FloorRow, SessionRow, SessionWithRelations } from "./types"
import { kstDayRange, addDaysToDateKey } from "./utils"

export function toSessionWithRelations(
  row: SessionRow & {
    floor?: FloorRow | FloorRow[] | null
    instructor?: SessionWithRelations["instructor"] | SessionWithRelations["instructor"][] | null
  },
): SessionWithRelations {
  return {
    ...row,
    image_paths: row.image_paths ?? [],
    description_blocks: normalizeDescriptionBlocks(row.description_blocks),
    floor: normalizeRelation(row.floor),
    instructor: normalizeRelation(row.instructor),
  }
}

export async function getFloors(): Promise<FloorRow[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("floors")
    .select("*")
    .order("sort_order", { ascending: true })

  if (error || !data) return []
  return data as FloorRow[]
}

export async function getSessionsForDay(dateKey: string): Promise<SessionWithRelations[]> {
  const next = addDaysToDateKey(dateKey, 1)
  return getSessionsForRange(dateKey, next)
}

export async function getSessionsForRange(
  startDateKey: string,
  endDateKeyExclusive: string,
): Promise<SessionWithRelations[]> {
  const supabase = await createClient()
  const { start } = kstDayRange(startDateKey)
  const { start: end } = kstDayRange(endDateKeyExclusive)

  const { data, error } = await supabase
    .from("sessions")
    .select(SESSION_WITH_RELATIONS)
    .gte("starts_at", start)
    .lt("starts_at", end)
    .neq("status", "cancelled")
    .order("starts_at", { ascending: true })

  if (error || !data) return []
  return data.map((row) =>
    toSessionWithRelations(
      row as SessionRow & {
        floor?: FloorRow | FloorRow[] | null
        instructor?: SessionWithRelations["instructor"] | SessionWithRelations["instructor"][] | null
      },
    ),
  )
}

export async function getUpcomingSessions(
  filter: { instructorId: string } | { userId: string },
  limit = 20,
): Promise<SessionWithRelations[]> {
  if (
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  ) {
    return []
  }

  const supabase = await createClient()
  let instructorId: string

  if ("instructorId" in filter) {
    instructorId = filter.instructorId
  } else {
    const { data: person, error: personError } = await supabase
      .from("partners")
      .select("id")
      .eq("user_id", filter.userId)
      .maybeSingle()

    if (personError) throw new Error(personError.message)
    if (!person) return []
    instructorId = person.id
  }

  const now = new Date().toISOString()

  let query = supabase
    .from("sessions")
    .select(SESSION_WITH_RELATIONS)
    .eq("instructor_id", instructorId)
    .eq("status", "confirmed")
    .eq("is_published", true)
    .gte("starts_at", now)
    .order("starts_at", { ascending: true })

  if (limit > 0) {
    query = query.limit(limit)
  }

  const { data, error } = await query

  if (error) throw new Error(error.message)
  if (!data) return []

  return data.map((row) =>
    toSessionWithRelations(
      row as SessionRow & {
        floor?: FloorRow | FloorRow[] | null
        instructor?: SessionWithRelations["instructor"] | SessionWithRelations["instructor"][] | null
      },
    ),
  )
}

export async function getUpcomingSessionsForInstructor(
  instructorId: string,
  limit = 20,
): Promise<SessionWithRelations[]> {
  return getUpcomingSessions({ instructorId }, limit)
}
