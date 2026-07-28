import { getAllPartnersAdmin } from "@/lib/partners/queries"
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
  searchParams: Promise<{
    date?: string
    floor?: string
    view?: string
    from?: string
    to?: string
  }>
}

// Agenda (date-range) view: defaults to today + 1 week, capped at ~2 months.
const AGENDA_DEFAULT_SPAN_DAYS = 6 // 오늘 포함 7일
const AGENDA_MAX_SPAN_DAYS = 61 // 약 2달

function isValidDateKey(value: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(value)
}

export default async function AdminSchedulePage({ searchParams }: PageProps) {
  const params = await searchParams
  const dateKey =
    params.date && isValidDateKey(params.date)
      ? params.date
      : todayDateKeyInKst()

  const view: ScheduleViewMode =
    params.view === "week"
      ? "week"
      : params.view === "agenda"
        ? "agenda"
        : "month"

  const floors = await getFloors()
  const floorSlug =
    params.floor && floors.some((f) => f.slug === params.floor)
      ? params.floor
      : floors[0]?.slug ?? "1f"

  // Resolve agenda range (used only when view === "agenda").
  const agendaFrom =
    params.from && isValidDateKey(params.from)
      ? params.from
      : todayDateKeyInKst()
  let agendaTo =
    params.to && isValidDateKey(params.to)
      ? params.to
      : addDaysToDateKey(agendaFrom, AGENDA_DEFAULT_SPAN_DAYS)
  if (agendaTo < agendaFrom) agendaTo = agendaFrom
  const agendaMaxTo = addDaysToDateKey(agendaFrom, AGENDA_MAX_SPAN_DAYS)
  if (agendaTo > agendaMaxTo) agendaTo = agendaMaxTo

  let rangeStart: string
  let rangeEndExclusive: string

  if (view === "agenda") {
    rangeStart = agendaFrom
    rangeEndExclusive = addDaysToDateKey(agendaTo, 1)
  } else if (view === "week") {
    rangeStart = startOfWeekDateKey(dateKey)
    rangeEndExclusive = addDaysToDateKey(endOfWeekDateKey(dateKey), 1)
  } else {
    const { year, month } = monthFromDateKey(dateKey)
    const range = monthCalendarRange(year, month)
    rangeStart = range.startDateKey
    rangeEndExclusive = range.endDateKeyExclusive
  }

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
