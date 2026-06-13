import { getAllPeopleAdmin } from "@/lib/people/queries"
import { getFloors, getSessionsForRange } from "@/lib/schedule/queries"
import {
  addDaysToDateKey,
  endOfWeekDateKey,
  monthCalendarRange,
  monthFromDateKey,
  startOfWeekDateKey,
  todayDateKeyInKst,
} from "@/lib/schedule/utils"
import {
  ScheduleAdminClient,
  type ScheduleViewMode,
} from "@/components/admin/schedule-admin-client"

type PageProps = {
  searchParams: Promise<{ date?: string; floor?: string; view?: string }>
}

function isValidDateKey(value: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(value)
}

export default async function AdminSchedulePage({ searchParams }: PageProps) {
  const params = await searchParams
  const dateKey =
    params.date && isValidDateKey(params.date)
      ? params.date
      : todayDateKeyInKst()

  const view: ScheduleViewMode = params.view === "month" ? "month" : "week"

  const floors = await getFloors()
  const floorSlug =
    params.floor && floors.some((f) => f.slug === params.floor)
      ? params.floor
      : floors[0]?.slug ?? "1f"

  let rangeStart: string
  let rangeEndExclusive: string

  if (view === "week") {
    rangeStart = startOfWeekDateKey(dateKey)
    rangeEndExclusive = addDaysToDateKey(endOfWeekDateKey(dateKey), 1)
  } else {
    const { year, month } = monthFromDateKey(dateKey)
    const range = monthCalendarRange(year, month)
    rangeStart = range.startDateKey
    rangeEndExclusive = range.endDateKeyExclusive
  }

  const [sessions, people] = await Promise.all([
    getSessionsForRange(rangeStart, rangeEndExclusive),
    getAllPeopleAdmin(),
  ])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-3xl font-light text-foreground">Schedule</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Floor weekly grid · month overview
        </p>
      </div>
      <ScheduleAdminClient
        dateKey={dateKey}
        view={view}
        floorSlug={floorSlug}
        floors={floors}
        sessions={sessions}
        people={people}
      />
    </div>
  )
}
