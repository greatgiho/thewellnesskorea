import type { ClassItem } from "@/components/schedule/types"
import { pathLabelKo, type PathKey } from "@/lib/paths/paths-data"
import { getInitials } from "@/lib/people/utils"
import type { SessionWithRelations } from "./types"
import {
  formatDateKeyInKst,
  formatTimeInKst,
  sessionDurationMinutes,
} from "./utils"

function periodFromTime(time: string): "AM" | "PM" {
  const hour = Number(time.split(":")[0])
  return hour < 12 ? "AM" : "PM"
}

function primaryPathKey(pathKeys: PathKey[]): PathKey | null {
  return pathKeys.length > 0 ? pathKeys[0] : null
}

export function mapSessionToClassItem(session: SessionWithRelations): ClassItem {
  const pathKey = primaryPathKey(session.path_keys ?? [])
  const start = formatTimeInKst(session.starts_at)
  const end = formatTimeInKst(session.ends_at)
  const durationMinutes = sessionDurationMinutes(session)
  const teacher = session.instructor?.name_en ?? "Wellness Guide"
  const spots = Math.max(0, session.capacity - session.booked_count)

  return {
    id: session.id,
    dateKey: formatDateKeyInKst(new Date(session.starts_at)),
    start,
    end,
    duration: `${durationMinutes} min`,
    title: session.title,
    categoryLabel: pathKey ? pathLabelKo(pathKey) : "Program",
    pathKey,
    level: "All Levels",
    teacher,
    initials: getInitials(teacher),
    spots,
    period: periodFromTime(start),
  }
}

export function mapSessionsToClassItems(
  sessions: SessionWithRelations[],
): ClassItem[] {
  return sessions.map(mapSessionToClassItem)
}
