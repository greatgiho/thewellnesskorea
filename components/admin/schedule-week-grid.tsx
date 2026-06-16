"use client"

import type { SessionWithRelations } from "@/lib/schedule/types"
import {
  buildTimeSlots,
  buildWeekDateKeys,
  dateKeyFromIso,
  formatDisplayDate,
  gridTotalHeightPx,
  sessionHeightPx,
  sessionTopPx,
  todayDateKeyInKst,
  WEEKDAY_LABELS_KO,
} from "@/lib/schedule/utils"
import { SLOT_HEIGHT_PX } from "@/lib/schedule/constants"
import { ScheduleSessionBlock } from "@/components/admin/schedule-session-block"

type ScheduleWeekGridProps = {
  weekAnchorDateKey: string
  floorId: string
  sessions: SessionWithRelations[]
  onSlotClick: (dateKey: string, time: string) => void
  onSessionClick: (session: SessionWithRelations) => void
}

export function ScheduleWeekGrid({
  weekAnchorDateKey,
  floorId,
  sessions,
  onSlotClick,
  onSessionClick,
}: ScheduleWeekGridProps) {
  const slots = buildTimeSlots()
  const totalHeight = gridTotalHeightPx()
  const weekDays = buildWeekDateKeys(weekAnchorDateKey)
  const today = todayDateKeyInKst()

  const floorSessions = sessions.filter((s) => s.floor_id === floorId)

  return (
    <div className="overflow-x-auto rounded-2xl border border-border bg-card">
      <div className="min-w-[800px]">
        <div className="grid grid-cols-[56px_repeat(7,minmax(0,1fr))] border-b border-border bg-secondary/40">
          <div className="px-2 py-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Time
          </div>
          {weekDays.map((dateKey, i) => {
            const isToday = dateKey === today
            return (
              <div
                key={dateKey}
                className={`border-l border-border px-2 py-2 text-center ${
                  isToday ? "bg-primary/10" : ""
                }`}
              >
                <p className="text-xs font-medium text-muted-foreground">
                  {WEEKDAY_LABELS_KO[i]}
                </p>
                <p
                  className={`font-serif text-lg leading-tight ${
                    isToday ? "text-primary" : "text-foreground"
                  }`}
                >
                  {dateKey.split("-")[2]}
                </p>
              </div>
            )
          })}
        </div>

        <div className="grid grid-cols-[56px_repeat(7,minmax(0,1fr))]">
          <div
            className="relative border-r border-border"
            style={{ height: totalHeight }}
          >
            {slots.map((time, i) => (
              <div
                key={time}
                className="absolute right-1 text-[10px] text-muted-foreground"
                style={{ top: i * SLOT_HEIGHT_PX + 2 }}
              >
                {time}
              </div>
            ))}
          </div>

          {weekDays.map((dateKey) => {
            const daySessions = floorSessions.filter(
              (s) => dateKeyFromIso(s.starts_at) === dateKey,
            )
            const isToday = dateKey === today

            return (
              <div
                key={dateKey}
                className={`relative border-r border-border last:border-r-0 ${
                  isToday ? "bg-primary/[0.03]" : ""
                }`}
                style={{ height: totalHeight }}
              >
                {slots.map((time, i) => (
                  <button
                    key={time}
                    type="button"
                    className="absolute inset-x-0 border-b border-border/40 transition-colors hover:bg-primary/5"
                    style={{
                      top: i * SLOT_HEIGHT_PX,
                      height: SLOT_HEIGHT_PX,
                    }}
                    onClick={() => onSlotClick(dateKey, time)}
                    aria-label={`Add session on ${formatDisplayDate(dateKey)} at ${time}`}
                  />
                ))}

                {daySessions.map((session) => (
                  <ScheduleSessionBlock
                    key={session.id}
                    session={session}
                    variant="week"
                    top={sessionTopPx(session) + 1}
                    height={Math.max(
                      sessionHeightPx(session) - 2,
                      SLOT_HEIGHT_PX - 2,
                    )}
                    onClick={() => onSessionClick(session)}
                  />
                ))}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
