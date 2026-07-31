import type { Metadata } from "next"
import { requireViewerSession } from "@/lib/auth/require-viewer-session"
import { getFloors, getSessionsForRange } from "@/lib/schedule/queries"
import {
  addDaysToDateKey,
  startOfWeekDateKey,
  todayDateKeyInKst,
} from "@/lib/schedule/utils"
import { ViewerScheduleClient } from "@/components/viewer/viewer-schedule-client"

export const metadata: Metadata = {
  title: "스케줄 조회 — The Wellness Korea",
}

type Props = { searchParams: Promise<{ date?: string; floor?: string }> }

function isValidDateKey(value: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(value)
}

export default async function ViewerSchedulePage({ searchParams }: Props) {
  await requireViewerSession()

  const params = await searchParams
  const dateKey =
    params.date && isValidDateKey(params.date)
      ? params.date
      : todayDateKeyInKst()

  const weekStart = startOfWeekDateKey(dateKey)
  const weekEndExclusive = addDaysToDateKey(weekStart, 7)

  const [floors, sessions] = await Promise.all([
    getFloors(),
    getSessionsForRange(weekStart, weekEndExclusive),
  ])

  return (
    <ViewerScheduleClient
      weekAnchorDateKey={weekStart}
      floors={floors}
      sessions={sessions}
      initialFloorId={params.floor ?? floors[0]?.id ?? ""}
    />
  )
}
