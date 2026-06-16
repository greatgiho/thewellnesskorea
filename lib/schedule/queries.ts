import { createClient } from "@/lib/supabase/server"
import { normalizeDescriptionBlocks } from "./images"
import { SESSION_WITH_RELATIONS } from "./constants"
import type { FloorRow, SessionRow, SessionWithRelations } from "./types"
import { kstDayRange, addDaysToDateKey } from "./utils"

function normalizeRelation<T>(value: T | T[] | null | undefined): T | undefined {
  if (!value) return undefined
  if (Array.isArray(value)) return value[0]
  return value
}

function toSessionWithRelations(
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
