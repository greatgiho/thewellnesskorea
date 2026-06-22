"use client"

import { useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { ChevronLeft, ChevronRight } from "lucide-react"
import type { PartnerWithPrograms } from "@/lib/partners/types"
import type { FloorRow, SessionWithRelations, ScheduleViewMode } from "@/lib/schedule/types"
import {
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
import { ScheduleFloorNav } from "@/components/admin/schedule-floor-nav"
import { ScheduleMonthCalendar } from "@/components/admin/schedule-month-calendar"
import { ScheduleWeekGrid } from "@/components/admin/schedule-week-grid"
import { SessionFormDialog } from "@/components/admin/session-form-dialog"

export type { ScheduleViewMode } from "@/lib/schedule/types"

type ScheduleAdminClientProps = {
  dateKey: string
  view: ScheduleViewMode
  floorSlug: string
  floors: FloorRow[]
  sessions: SessionWithRelations[]
  partners: PartnerWithPrograms[]
}

function buildScheduleUrl(
  date: string,
  view: ScheduleViewMode,
  floorSlug: string,
): string {
  const params = new URLSearchParams({ date, view, floor: floorSlug })
  return `/admin/schedule?${params.toString()}`
}

export function ScheduleAdminClient({
  dateKey,
  view,
  floorSlug,
  floors,
  sessions,
  partners,
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

  const setView = (nextView: ScheduleViewMode) => {
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

  if (!activeFloor) {
    return (
      <p className="text-sm text-muted-foreground">
        No floors configured. Run schedule migration.
      </p>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex rounded-lg border border-border p-0.5">
            <button
              type="button"
              onClick={() => setView("week")}
              className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                view === "week"
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Week
            </button>
            <button
              type="button"
              onClick={() => setView("month")}
              className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                view === "month"
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Month
            </button>
          </div>

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
        <ScheduleFloorNav
          floors={floors}
          activeFloorId={activeFloor.id}
          onSelect={setFloor}
        />

        <div className="min-w-0 flex-1 space-y-2">
          <p className="text-sm text-muted-foreground">
            {activeFloor.name_ko} · {activeFloor.name_en}
            {view === "week"
              ? " · Mon–Sun · 06:00–24:00 · click slot to add"
              : " · month overview · click session to edit"}
          </p>

          {view === "week" ? (
            <ScheduleWeekGrid
              weekAnchorDateKey={dateKey}
              floorId={activeFloor.id}
              sessions={sessions}
              onSlotClick={(dayKey, time) =>
                openCreate(activeFloor.id, time, dayKey)
              }
              onSessionClick={openEdit}
            />
          ) : (
            <ScheduleMonthCalendar
              year={year}
              month={month}
              floorId={activeFloor.id}
              sessions={sessions}
              onDayClick={(dayKey) => navigate(dayKey, "week")}
              onSessionClick={openEdit}
            />
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
