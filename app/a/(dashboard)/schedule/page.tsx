import { getAllPartnersAdmin } from "@/lib/partners/queries"
import { getFloors, getSessionsForRange } from "@/lib/schedule/queries"
import { resolveScheduleView } from "@/lib/schedule/view-range"
import {
  ScheduleAdminClient,
  type ScheduleViewMode,
} from "@/components/admin/schedule-admin-client"

type PageProps = {
  searchParams: Promise<{
    date?: string
    floor?: string
    view?: string
    from?: string
    to?: string
  }>
}

export default async function AdminSchedulePage({ searchParams }: PageProps) {
  const params = await searchParams
  const { view, dateKey, agendaFrom, agendaTo, rangeStart, rangeEndExclusive } =
    resolveScheduleView(params)

  const floors = await getFloors()
  const floorSlug =
    params.floor && floors.some((f) => f.slug === params.floor)
      ? params.floor
      : floors[0]?.slug ?? "1f"

  const [sessions, partners] = await Promise.all([
    getSessionsForRange(rangeStart, rangeEndExclusive),
    getAllPartnersAdmin(),
  ])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-3xl font-light text-foreground">Schedule</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Agenda range · floor weekly grid · month overview
        </p>
      </div>
      <ScheduleAdminClient
        dateKey={dateKey}
        view={view}
        floorSlug={floorSlug}
        floors={floors}
        sessions={sessions}
        partners={partners}
        agendaFrom={agendaFrom}
        agendaTo={agendaTo}
      />
    </div>
  )
}
