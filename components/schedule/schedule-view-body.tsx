"use client"

import { useMemo, useState, type ReactNode } from "react"
import {
  ScheduleFloorNav,
  ScheduleFloorChips,
} from "@/components/admin/schedule-floor-nav"
import { ScheduleAgendaTimeline } from "@/components/admin/schedule-agenda-timeline"
import { ScheduleWeekGrid } from "@/components/admin/schedule-week-grid"
import { ScheduleMonthCalendar } from "@/components/admin/schedule-month-calendar"
import { monthFromDateKey } from "@/lib/schedule/utils"
import type {
  FloorRow,
  ScheduleViewMode,
  SessionWithRelations,
} from "@/lib/schedule/types"

/**
 * The agenda / week / month bodies, shared by the admin schedule and the
 * read-only viewer dashboard.
 *
 * Editing is expressed by which handlers the caller passes, not by a mode
 * flag: omit `onSlotClick` and empty slots stop being actionable, omit
 * `onDayClick` and the month view stops drilling into a week. A read-only
 * caller simply passes neither, so there is no "am I allowed" branch inside
 * to get wrong.
 *
 * Floor visibility is local view state with no meaning outside these grids,
 * so it lives here rather than in each caller.
 */
type Props = {
  view: ScheduleViewMode
  dateKey: string
  floors: FloorRow[]
  sessions: SessionWithRelations[]
  activeFloorId: string
  onSelectFloor: (floorId: string) => void
  onSessionClick: (session: SessionWithRelations) => void
  onSlotClick?: (dateKey: string, time: string) => void
  onDayClick?: (dateKey: string) => void
  weekHint?: ReactNode
  monthHint?: ReactNode
}

export function ScheduleViewBody({
  view,
  dateKey,
  floors,
  sessions,
  activeFloorId,
  onSelectFloor,
  onSessionClick,
  onSlotClick,
  onDayClick,
  weekHint,
  monthHint,
}: Props) {
  const [visibleLevels, setVisibleLevels] = useState<Set<number>>(
    () => new Set(floors.map((f) => f.level)),
  )
  const visibleFloorIds = useMemo(
    () =>
      new Set(floors.filter((f) => visibleLevels.has(f.level)).map((f) => f.id)),
    [floors, visibleLevels],
  )
  const toggleLevel = (level: number) =>
    setVisibleLevels((prev) => {
      const next = new Set(prev)
      if (next.has(level)) next.delete(level)
      else next.add(level)
      return next
    })
  const showAllLevels = () => setVisibleLevels(new Set(floors.map((f) => f.level)))

  const { year, month } = monthFromDateKey(dateKey)

  return (
    <div className="flex flex-col gap-4 lg:flex-row">
      {view === "week" && (
        <ScheduleFloorNav
          floors={floors}
          activeFloorId={activeFloorId}
          onSelect={onSelectFloor}
        />
      )}

      <div className="min-w-0 flex-1 space-y-2">
        {view === "agenda" ? (
          <ScheduleAgendaTimeline
            floors={floors}
            sessions={sessions}
            onSessionClick={onSessionClick}
          />
        ) : view === "week" ? (
          <>
            {weekHint ? (
              <p className="text-sm text-muted-foreground">{weekHint}</p>
            ) : null}
            <ScheduleWeekGrid
              weekAnchorDateKey={dateKey}
              floorId={activeFloorId}
              sessions={sessions}
              onSlotClick={onSlotClick ?? (() => {})}
              onSessionClick={onSessionClick}
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
              {monthHint ? (
                <p className="text-xs text-muted-foreground">{monthHint}</p>
              ) : null}
            </div>
            <ScheduleMonthCalendar
              year={year}
              month={month}
              floors={floors}
              visibleFloorIds={visibleFloorIds}
              sessions={sessions}
              onDayClick={onDayClick ?? (() => {})}
              onSessionClick={onSessionClick}
            />
          </>
        )}
      </div>
    </div>
  )
}
