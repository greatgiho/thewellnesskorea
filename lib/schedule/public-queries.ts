import { createClient } from "@/lib/supabase/server"
import { SESSION_WITH_RELATIONS } from "./constants"
import { mapSessionsToClassItems } from "./map-public-class"
import {
  getPublicScheduleRangeEndKey,
  PUBLIC_SCHEDULE_RANGE_DAYS,
} from "./public-week"
import type { ClassItem } from "@/components/schedule/types"
import type { FloorRow, SessionRow, SessionWithRelations } from "./types"
import { toSessionWithRelations } from "./queries"
import { kstDayRange, todayDateKeyInKst } from "./utils"

export type PublicScheduleByExperience = Record<string, ClassItem[]>

export async function getPublishedSessionsForExperienceIds(
  experienceIds: string[],
  startDateKey: string,
  endDateKeyExclusive: string,
): Promise<SessionWithRelations[]> {
  if (
    experienceIds.length === 0 ||
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  ) {
    return []
  }

  const supabase = await createClient()
  const { start } = kstDayRange(startDateKey)
  const { start: end } = kstDayRange(endDateKeyExclusive)

  const { data, error } = await supabase
    .from("sessions")
    .select(SESSION_WITH_RELATIONS)
    .in("experience_id", experienceIds)
    .eq("status", "confirmed")
    .eq("is_published", true)
    .gte("starts_at", start)
    .lt("starts_at", end)
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

export async function getPublicScheduleForExperiences(
  experienceIds: string[],
): Promise<PublicScheduleByExperience> {
  const startKey = todayDateKeyInKst()
  const endKey = getPublicScheduleRangeEndKey(startKey)
  const sessions = await getPublishedSessionsForExperienceIds(
    experienceIds,
    startKey,
    endKey,
  )
  const classItems = mapSessionsToClassItems(sessions)

  const grouped: PublicScheduleByExperience = {}
  for (const item of classItems) {
    const session = sessions.find((s) => s.id === item.id)
    const experienceId = session?.experience_id
    if (!experienceId) continue
    if (!grouped[experienceId]) grouped[experienceId] = []
    grouped[experienceId].push(item)
  }

  for (const experienceId of Object.keys(grouped)) {
    grouped[experienceId].sort((a, b) => {
      const byDate = a.dateKey.localeCompare(b.dateKey)
      if (byDate !== 0) return byDate
      return a.start.localeCompare(b.start)
    })
  }

  return grouped
}

export { PUBLIC_SCHEDULE_RANGE_DAYS }
