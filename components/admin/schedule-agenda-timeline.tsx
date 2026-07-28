"use client"

import type { FloorRow, SessionWithRelations } from "@/lib/schedule/types"
import {
  dateKeyFromIso,
  formatDisplayDate,
  formatTimeInKst,
} from "@/lib/schedule/utils"

type ScheduleAgendaTimelineProps = {
  floors: FloorRow[]
  sessions: SessionWithRelations[]
  onSessionClick: (session: SessionWithRelations) => void
}

type TimeGroup = { time: string; items: SessionWithRelations[] }
type DayGroup = { dateKey: string; times: TimeGroup[] }

/**
 * Agenda over a date range: each day gets a big date heading, then a vertical
 * rule with a dot at each start time, and the sessions under it — showing the
 * space zone(s) each session occupies so partners can spot free zone/time.
 * Days with no sessions are omitted.
 */
export function ScheduleAgendaTimeline({
  floors,
  sessions,
  onSessionClick,
}: ScheduleAgendaTimelineProps) {
  const floorName = (session: SessionWithRelations): string => {
    if (session.is_all_floors) return "전 층"
    return (
      session.floor?.name_ko ??
      floors.find((f) => f.id === session.floor_id)?.name_ko ??
      "미지정"
    )
  }

  const sorted = [...sessions].sort((a, b) =>
    a.starts_at.localeCompare(b.starts_at),
  )

  const days: DayGroup[] = []
  for (const s of sorted) {
    const dateKey = dateKeyFromIso(s.starts_at)
    const time = formatTimeInKst(s.starts_at)
    let day = days[days.length - 1]
    if (!day || day.dateKey !== dateKey) {
      day = { dateKey, times: [] }
      days.push(day)
    }
    const lastTime = day.times[day.times.length - 1]
    if (lastTime && lastTime.time === time) lastTime.items.push(s)
    else day.times.push({ time, items: [s] })
  }

  if (days.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        이 기간에 세션이 없습니다.
      </p>
    )
  }

  return (
    <div className="space-y-8">
      {days.map((day) => (
        <section key={day.dateKey}>
          <h2 className="mb-3 font-serif text-2xl font-light text-foreground">
            {formatDisplayDate(day.dateKey)}
          </h2>
          <ol className="relative ml-2 border-l border-border pl-6">
            {day.times.map((group) => (
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
                          {formatTimeInKst(s.starts_at)}–
                          {formatTimeInKst(s.ends_at)}
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
        </section>
      ))}
    </div>
  )
}
