"use client"

import { pathLabelKo } from "@/lib/paths/paths-data"
import type { SessionWithRelations } from "@/lib/schedule/types"
import {
  buildTimeSlots,
  formatTimeInKst,
  gridTotalHeightPx,
  sessionHeightPx,
  sessionTopPx,
  groupSessionsByFloor,
} from "@/lib/schedule/utils"
import { SLOT_HEIGHT_PX } from "@/lib/schedule/constants"
import type { FloorRow } from "@/lib/schedule/types"

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
                  <button
                    key={session.id}
                    type="button"
                    onClick={() => onSessionClick(session)}
                    className={`absolute inset-x-1 z-10 overflow-hidden rounded-lg border px-2 py-1 text-left shadow-sm transition-all hover:brightness-95 ${
                      session.is_published
                        ? "border-primary/30 bg-primary/15"
                        : "border-border bg-secondary/80"
                    }`}
                    style={{
                      top: sessionTopPx(session) + 1,
                      height: Math.max(sessionHeightPx(session) - 2, SLOT_HEIGHT_PX - 2),
                    }}
                  >
                    <p className="truncate text-xs font-medium text-foreground">
                      {session.title}
                    </p>
                    <p className="truncate text-[10px] text-muted-foreground">
                      {formatTimeInKst(session.starts_at)}–
                      {formatTimeInKst(session.ends_at)}
                    </p>
                    <p className="truncate text-[10px] text-primary/90">
                      {session.instructor?.name_en ?? "—"}
                    </p>
                    {session.path_keys?.length > 0 && (
                      <p className="mt-0.5 truncate text-[9px] uppercase tracking-wide text-primary/70">
                        {session.path_keys.map(pathLabelKo).join(" · ")}
                      </p>
                    )}
                  </button>
                ))}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
