import type { Metadata } from "next"
import { requireViewerSession } from "@/lib/auth/require-viewer-session"
import { getFloors, getSessionsForRange } from "@/lib/schedule/queries"
import { resolveScheduleView } from "@/lib/schedule/view-range"
import { ViewerScheduleClient } from "@/components/viewer/viewer-schedule-client"

export const metadata: Metadata = {
  title: "스케줄 조회 — The Wellness Korea",
}

type Props = {
  searchParams: Promise<{
    date?: string
    view?: string
    from?: string
    to?: string
    floor?: string
  }>
}

export default async function ViewerSchedulePage({ searchParams }: Props) {
  await requireViewerSession()

  const params = await searchParams
  const { view, dateKey, agendaFrom, agendaTo, rangeStart, rangeEndExclusive } =
    resolveScheduleView(params)

  const floors = await getFloors()
  const floorSlug =
    params.floor && floors.some((f) => f.slug === params.floor)
      ? params.floor
      : floors[0]?.slug ?? "1f"

  const sessions = await getSessionsForRange(rangeStart, rangeEndExclusive)

  return (
    <ViewerScheduleClient
      view={view}
      dateKey={dateKey}
      floorSlug={floorSlug}
      floors={floors}
      sessions={sessions}
      agendaFrom={agendaFrom}
      agendaTo={agendaTo}
    />
  )
}
