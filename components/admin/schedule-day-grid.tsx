"use client"

import type { SessionWithRelations } from "@/lib/schedule/types"
import {
  buildTimeSlots,
  gridTotalHeightPx,
  sessionHeightPx,
  sessionTopPx,
  groupSessionsByFloor,
} from "@/lib/schedule/utils"
import { SLOT_HEIGHT_PX } from "@/lib/schedule/constants"
import type { FloorRow } from "@/lib/schedule/types"
import { ScheduleSessionBlock } from "@/components/admin/schedule-session-block"

type ScheduleDayGridProps = {
  floors: FloorRow[]
  sessions: SessionWithRelations[]
  onSlotClick: (floorId: string, time: string) => void
  onSessionClick: (session: SessionWithRelations) => void
}

export function ScheduleDayGrid({
  floors,
  sessions,
  onSlotClick,
  onSessionClick,
}: ScheduleDayGridProps) {
  const slots = buildTimeSlots()
  const totalHeight = gridTotalHeightPx()
  const byFloor = groupSessionsByFloor(sessions)

  return (
    <div className="overflow-x-auto rounded-2xl border border-border bg-card">
      <div className="min-w-[900px]">
        <div className="grid grid-cols-[64px_repeat(4,minmax(0,1fr))] border-b border-border bg-secondary/40">
          <div className="px-2 py-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Time
          </div>
          {floors.map((floor) => (
            <div
              key={floor.id}
              className="border-l border-border px-3 py-3 text-center"
            >
              <p className="font-medium text-foreground">{floor.name_en}</p>
              <p className="text-xs text-muted-foreground">{floor.name_ko}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-[64px_repeat(4,minmax(0,1fr))]">
          <div className="relative border-r border-border" style={{ height: totalHeight }}>
            {slots.map((time, i) => (
              <div
                key={time}
                className="absolute right-2 text-[10px] text-muted-foreground"
                style={{ top: i * SLOT_HEIGHT_PX + 2 }}
              >
                {time}
              </div>
            ))}
          </div>

          {floors.map((floor) => {
            const floorSessions = byFloor.get(floor.id) ?? []
            return (
              <div
                key={floor.id}
                className="relative border-r border-border last:border-r-0"
                style={{ height: totalHeight }}
              >
                {slots.map((time, i) => (
                  <button
                    key={time}
                    type="button"
                    className="absolute inset-x-0 border-b border-border/40 hover:bg-primary/5 transition-colors"
                    style={{
                      top: i * SLOT_HEIGHT_PX,
                      height: SLOT_HEIGHT_PX,
                    }}
                    onClick={() => onSlotClick(floor.id, time)}
                    aria-label={`Add session on ${floor.name_en} at ${time}`}
                  />
                ))}

                {floorSessions.map((session) => (
                  <ScheduleSessionBlock
                    key={session.id}
                    session={session}
                    variant="day"
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
