"use client"

import { useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { ChevronLeft, ChevronRight } from "lucide-react"
import type { PartnerWithPrograms } from "@/lib/partners/types"
import type { FloorRow, SessionWithRelations, ScheduleViewMode } from "@/lib/schedule/types"
import {
  addDaysToDateKey,
  addMonthsToDateKey,
  addWeeksToDateKey,
  dateKeyFromIso,
  endOfWeekDateKey,
  formatMonthLabel,
  formatWeekRangeLabel,
  monthFromDateKey,
  startOfWeekDateKey,
  todayDateKeyInKst,
} from "@/lib/schedule/utils"
import { SchedulePeriodPicker } from "@/components/admin/schedule-period-picker"
import {
  ScheduleFloorChips,
  ScheduleFloorNav,
} from "@/components/admin/schedule-floor-nav"
import { ScheduleMonthCalendar } from "@/components/admin/schedule-month-calendar"
import { ScheduleWeekGrid } from "@/components/admin/schedule-week-grid"
import { ScheduleAgendaTimeline } from "@/components/admin/schedule-agenda-timeline"
import { SessionFormDialog } from "@/components/admin/session-form-dialog"

export type { ScheduleViewMode } from "@/lib/schedule/types"

const AGENDA_MAX_SPAN_DAYS = 61 // 약 2달
const AGENDA_DEFAULT_SPAN_DAYS = 6 // 오늘 포함 7일

type ScheduleAdminClientProps = {
  dateKey: string
  view: ScheduleViewMode
  floorSlug: string
  floors: FloorRow[]
  sessions: SessionWithRelations[]
  partners: PartnerWithPrograms[]
  agendaFrom: string
  agendaTo: string
}

function buildScheduleUrl(
  date: string,
  view: ScheduleViewMode,
  floorSlug: string,
): string {
  const params = new URLSearchParams({ date, view, floor: floorSlug })
  return `/a/schedule?${params.toString()}`
}

function spanDaysInclusive(from: string, to: string): number {
  const ms = Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)
  return Math.max(1, Math.round(ms / 86_400_000) + 1)
}

export function ScheduleAdminClient({
  dateKey,
  view,
  floorSlug,
  floors,
  sessions,
  partners,
  agendaFrom,
  agendaTo,
}: ScheduleAdminClientProps) {
  const router = useRouter()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingSession, setEditingSession] = useState<SessionWithRelations | null>(null)
  const [formDateKey, setFormDateKey] = useState(dateKey)
  const [presetFloorId, setPresetFloorId] = useState<string | undefined>()
  const [presetStartTime, setPresetStartTime] = useState<string | undefined>()

  const activeFloor = useMemo(() => {
    const bySlug = floors.find((f) => f.slug === floorSlug)
    return bySlug ?? floors[0]
  }, [floors, floorSlug])

  const [visibleLevels, setVisibleLevels] = useState<Set<number>>(
    () => new Set(floors.map((f) => f.level)),
  )
  const visibleFloorIds = useMemo(
    () =>
      new Set(
        floors.filter((f) => visibleLevels.has(f.level)).map((f) => f.id),
      ),
    [floors, visibleLevels],
  )
  const toggleLevel = (level: number) =>
    setVisibleLevels((prev) => {
      const next = new Set(prev)
      if (next.has(level)) next.delete(level)
      else next.add(level)
      return next
    })
  const showAllLevels = () =>
    setVisibleLevels(new Set(floors.map((f) => f.level)))

  const { year, month } = monthFromDateKey(dateKey)
  const weekStart = startOfWeekDateKey(dateKey)
  const weekEnd = endOfWeekDateKey(dateKey)
  const today = todayDateKeyInKst()

  const navigate = (nextDate: string, nextView?: ScheduleViewMode, nextFloor?: string) => {
    router.push(
      buildScheduleUrl(
        nextDate,
        nextView ?? view,
        nextFloor ?? activeFloor?.slug ?? floorSlug,
      ),
    )
  }

  const goAgenda = (from: string, to: string) => {
    router.push(`/a/schedule?view=agenda&from=${from}&to=${to}`)
  }

  const setView = (nextView: ScheduleViewMode) => {
    if (nextView === "agenda") {
      router.push("/a/schedule?view=agenda")
      return
    }
    navigate(dateKey, nextView)
  }

  const setFloor = (floorId: string) => {
    const floor = floors.find((f) => f.id === floorId)
    if (floor) navigate(dateKey, view, floor.slug)
  }

  const openCreate = (floorId?: string, time?: string, dayKey?: string) => {
    setEditingSession(null)
    setFormDateKey(dayKey ?? dateKey)
    setPresetFloorId(floorId ?? activeFloor?.id)
    setPresetStartTime(time)
    setDialogOpen(true)
  }

  const openEdit = (session: SessionWithRelations) => {
    setEditingSession(session)
    setFormDateKey(dateKeyFromIso(session.starts_at))
    setPresetFloorId(undefined)
    setPresetStartTime(undefined)
    setDialogOpen(true)
  }

  const closeDialog = () => {
    setDialogOpen(false)
    setEditingSession(null)
  }

  const onSaved = () => router.refresh()

  const agendaSpan = spanDaysInclusive(agendaFrom, agendaTo)
  const agendaMaxTo = addDaysToDateKey(agendaFrom, AGENDA_MAX_SPAN_DAYS)
  const inputClass =
    "h-9 rounded-lg border border-border bg-background px-2 text-sm text-foreground"

  if (!activeFloor) {
    return (
      <p className="text-sm text-muted-foreground">
        No floors configured. Run schedule migration.
      </p>
    )
  }

  const viewButton = (mode: ScheduleViewMode, label: string) => (
    <button
      type="button"
      onClick={() => setView(mode)}
      className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
        view === mode
          ? "bg-primary text-primary-foreground"
          : "text-muted-foreground hover:text-foreground"
      }`}
    >
      {label}
    </button>
  )

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex rounded-lg border border-border p-0.5">
            {viewButton("agenda", "Agenda")}
            {viewButton("week", "Week")}
            {viewButton("month", "Month")}
          </div>

          {view === "agenda" ? (
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() =>
                  goAgenda(
                    addDaysToDateKey(agendaFrom, -agendaSpan),
                    addDaysToDateKey(agendaTo, -agendaSpan),
                  )
                }
                className="flex size-9 items-center justify-center rounded-lg border border-border hover:bg-muted"
                aria-label="Previous range"
              >
                <ChevronLeft className="size-4" />
              </button>
              <input
                type="date"
                value={agendaFrom}
                max={agendaTo}
                onChange={(e) => e.target.value && goAgenda(e.target.value, agendaTo)}
                className={inputClass}
                aria-label="From date"
              />
              <span className="text-muted-foreground">~</span>
              <input
                type="date"
                value={agendaTo}
                min={agendaFrom}
                max={agendaMaxTo}
                onChange={(e) => e.target.value && goAgenda(agendaFrom, e.target.value)}
                className={inputClass}
                aria-label="To date"
              />
              <button
                type="button"
                onClick={() =>
                  goAgenda(
                    addDaysToDateKey(agendaFrom, agendaSpan),
                    addDaysToDateKey(agendaTo, agendaSpan),
                  )
                }
                className="flex size-9 items-center justify-center rounded-lg border border-border hover:bg-muted"
                aria-label="Next range"
              >
                <ChevronRight className="size-4" />
              </button>
              <button
                type="button"
                onClick={() =>
                  goAgenda(today, addDaysToDateKey(today, AGENDA_DEFAULT_SPAN_DAYS))
                }
                className="text-sm text-primary underline-offset-4 hover:underline"
              >
                Today
              </button>
              <span className="text-xs text-muted-foreground">최대 2달</span>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() =>
                  navigate(
                    view === "week"
                      ? addWeeksToDateKey(dateKey, -1)
                      : addMonthsToDateKey(dateKey, -1),
                  )
                }
                className="flex size-9 items-center justify-center rounded-lg border border-border hover:bg-muted"
                aria-label="Previous"
              >
                <ChevronLeft className="size-4" />
              </button>
              <SchedulePeriodPicker
                label={
                  view === "week"
                    ? formatWeekRangeLabel(weekStart, weekEnd)
                    : formatMonthLabel(year, month)
                }
                view={view}
                dateKey={dateKey}
                weekStart={weekStart}
                onNavigate={(nextDate, nextView) => navigate(nextDate, nextView)}
              />
              <button
                type="button"
                onClick={() =>
                  navigate(
                    view === "week"
                      ? addWeeksToDateKey(dateKey, 1)
                      : addMonthsToDateKey(dateKey, 1),
                  )
                }
                className="flex size-9 items-center justify-center rounded-lg border border-border hover:bg-muted"
                aria-label="Next"
              >
                <ChevronRight className="size-4" />
              </button>
              {dateKey !== today && (
                <button
                  type="button"
                  onClick={() => navigate(today)}
                  className="text-sm text-primary underline-offset-4 hover:underline"
                >
                  Today
                </button>
              )}
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={() => openCreate(activeFloor.id)}
          className="inline-flex h-9 items-center rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          Add session
        </button>
      </div>

      <div className="flex flex-col gap-4 lg:flex-row">
        {view === "week" && (
          <ScheduleFloorNav
            floors={floors}
            activeFloorId={activeFloor.id}
            onSelect={setFloor}
          />
        )}

        <div className="min-w-0 flex-1 space-y-2">
          {view === "agenda" ? (
            <ScheduleAgendaTimeline
              floors={floors}
              sessions={sessions}
              onSessionClick={openEdit}
            />
          ) : view === "week" ? (
            <>
              <p className="text-sm text-muted-foreground">
                {activeFloor.name_ko} · {activeFloor.name_en} · Mon–Sun ·
                06:00–24:00 · click slot to add
              </p>
              <ScheduleWeekGrid
                weekAnchorDateKey={dateKey}
                floorId={activeFloor.id}
                sessions={sessions}
                onSlotClick={(dayKey, time) =>
                  openCreate(activeFloor.id, time, dayKey)
                }
                onSessionClick={openEdit}
              />
            </>
          ) : (
            <>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <ScheduleFloorChips
                  floors={floors}
                  visibleLevels={visibleLevels}
                  onToggleLevel={toggleLevel}
                  onShowAll={showAllLevels}
                />
                <p className="text-xs text-muted-foreground">
                  전 층 · click session to edit
                </p>
              </div>
              <ScheduleMonthCalendar
                year={year}
                month={month}
                floors={floors}
                visibleFloorIds={visibleFloorIds}
                sessions={sessions}
                onDayClick={(dayKey) => navigate(dayKey, "week")}
                onSessionClick={openEdit}
              />
            </>
          )}
        </div>
      </div>

      <SessionFormDialog
        open={dialogOpen}
        dateKey={formDateKey}
        floors={floors}
        partners={partners}
        session={editingSession}
        presetFloorId={presetFloorId}
        presetStartTime={presetStartTime}
        onClose={closeDialog}
        onSaved={onSaved}
      />
    </div>
  )
}
