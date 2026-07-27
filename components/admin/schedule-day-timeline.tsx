"use client"

import type { FloorRow, SessionWithRelations } from "@/lib/schedule/types"
import {
  dateKeyFromIso,
  formatDisplayDate,
  formatTimeInKst,
} from "@/lib/schedule/utils"

type ScheduleDayTimelineProps = {
  dateKey: string
  floors: FloorRow[]
  sessions: SessionWithRelations[]
  onSessionClick: (session: SessionWithRelations) => void
}

type TimeGroup = { time: string; items: SessionWithRelations[] }

/**
 * Vertical daily timeline: big date heading, a vertical rule with a dot at each
 * start time, sessions listed under it with duration and the space zone(s) they
 * occupy — so partners can see which zone/time is free.
 */
export function ScheduleDayTimeline({
  dateKey,
  floors,
  sessions,
  onSessionClick,
}: ScheduleDayTimelineProps) {
  const floorName = (session: SessionWithRelations): string => {
    if (session.is_all_floors) return "전 층"
    return (
      session.floor?.name_ko ??
      floors.find((f) => f.id === session.floor_id)?.name_ko ??
      "미지정"
    )
  }

  const daySessions = sessions
    .filter((s) => dateKeyFromIso(s.starts_at) === dateKey)
    .sort((a, b) => a.starts_at.localeCompare(b.starts_at))

  const groups: TimeGroup[] = []
  for (const s of daySessions) {
    const time = formatTimeInKst(s.starts_at)
    const last = groups[groups.length - 1]
    if (last && last.time === time) last.items.push(s)
    else groups.push({ time, items: [s] })
  }

  return (
    <div className="space-y-4">
      <h2 className="font-serif text-2xl font-light text-foreground">
        {formatDisplayDate(dateKey)}
      </h2>

      {groups.length === 0 ? (
        <p className="text-sm text-muted-foreground">이 날 세션이 없습니다.</p>
      ) : (
        <ol className="relative ml-2 border-l border-border pl-6">
          {groups.map((group) => (
            <li key={group.time} className="mb-6 last:mb-0">
              <span
                className="absolute -left-[7px] mt-1 size-3.5 rounded-full border-2 border-background bg-primary"
                aria-hidden
              />
              <div className="mb-2 font-mono text-sm font-semibold text-foreground">
                {group.time}
              </div>
              <ul className="space-y-2">
                {group.items.map((s) => (
                  <li key={s.id}>
                    <button
                      type="button"
                      onClick={() => onSessionClick(s)}
                      className={`flex w-full flex-wrap items-center gap-x-3 gap-y-1 rounded-lg border border-border bg-card px-3 py-2 text-left transition-colors hover:bg-muted ${
                        s.status === "cancelled" ? "opacity-50" : ""
                      }`}
                    >
                      <span className="font-medium text-foreground">
                        {s.title || "제목 없음"}
                      </span>
                      <span className="font-mono text-xs text-muted-foreground">
                        {formatTimeInKst(s.starts_at)}–{formatTimeInKst(s.ends_at)}
                      </span>
                      <span className="rounded-full bg-secondary px-2 py-0.5 text-xs font-medium text-secondary-foreground">
                        {floorName(s)}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {s.booked_count}/{s.capacity}
                      </span>
                      {s.status === "cancelled" && (
                        <span className="text-xs font-medium text-red-600">
                          취소됨
                        </span>
                      )}
                    </button>
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ol>
      )}
    </div>
  )
}
