"use client"

import type { SessionWithRelations } from "@/lib/schedule/types"
import {
  buildMonthCalendarDays,
  formatTimeInKst,
  groupSessionsByDateKey,
  monthFromDateKey,
  todayDateKeyInKst,
  WEEKDAY_LABELS_KO,
} from "@/lib/schedule/utils"

type ScheduleMonthCalendarProps = {
  year: number
  month: number
  floorId: string
  sessions: SessionWithRelations[]
  onDayClick: (dateKey: string) => void
  onSessionClick: (session: SessionWithRelations) => void
}

export function ScheduleMonthCalendar({
  year,
  month,
  floorId,
  sessions,
  onDayClick,
  onSessionClick,
}: ScheduleMonthCalendarProps) {
  const cells = buildMonthCalendarDays(year, month)
  const today = todayDateKeyInKst()

  const floorSessions = sessions.filter((s) => s.floor_id === floorId)
  const byDate = groupSessionsByDateKey(floorSessions)

  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card">
      <div className="grid grid-cols-7 border-b border-border bg-secondary/40">
        {WEEKDAY_LABELS_KO.map((label) => (
          <div
            key={label}
            className="px-2 py-2 text-center text-xs font-medium uppercase tracking-wider text-muted-foreground"
          >
            {label}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7">
        {cells.map((cell, index) => {
          if (!cell.dateKey) {
            return (
              <div
                key={`empty-${index}`}
                className="min-h-[120px] border-b border-r border-border bg-muted/20"
              />
            )
          }

          const dateKey = cell.dateKey
          const daySessions = byDate.get(dateKey) ?? []
          const isToday = dateKey === today
          const dayNum = Number(dateKey.split("-")[2])

          return (
            <div
              key={dateKey}
              className={`min-h-[120px] border-b border-r border-border p-1.5 ${
                cell.inMonth ? "bg-card" : "bg-muted/15"
              } ${isToday ? "bg-primary/[0.06]" : ""}`}
            >
              <button
                type="button"
                onClick={() => onDayClick(dateKey)}
                className={`mb-1 flex size-7 items-center justify-center rounded-full text-sm font-medium transition-colors hover:bg-muted ${
                  isToday
                    ? "bg-primary text-primary-foreground hover:bg-primary/90"
                    : cell.inMonth
                      ? "text-foreground"
                      : "text-muted-foreground"
                }`}
                aria-label={`View ${dateKey}`}
              >
                {dayNum}
              </button>

              <ul className="space-y-1">
                {daySessions.slice(0, 4).map((session) => (
                  <li key={session.id}>
                    <button
                      type="button"
                      onClick={() => onSessionClick(session)}
                      className={`w-full rounded-md border px-1.5 py-1 text-left transition-colors hover:brightness-95 ${
                        session.status === "processing"
                          ? "border-dashed border-amber-400/60 bg-amber-50/70 dark:bg-amber-950/20"
                          : session.is_published
                            ? "border-primary/25 bg-primary/10"
                            : session.status === "confirmed"
                              ? "border-blue-600/25 bg-blue-50/60 dark:bg-blue-950/20"
                              : "border-border bg-secondary/60"
                      }`}
                    >
                      <p className="truncate text-[10px] font-medium leading-tight text-foreground">
                        <span className="text-muted-foreground">
                          {formatTimeInKst(session.starts_at)}
                        </span>
                        {" "}
                        {session.title}
                      </p>
                      <p className="truncate text-[9px] text-primary/80">
                        {session.instructor?.name_en ?? "—"}
                      </p>
                    </button>
                  </li>
                ))}
                {daySessions.length > 4 && (
                  <li className="px-1 text-[10px] text-muted-foreground">
                    +{daySessions.length - 4} more
                  </li>
                )}
              </ul>
            </div>
          )
        })}
      </div>
    </div>
  )
}
