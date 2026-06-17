"use client"

import { useEffect, useId, useRef, useState } from "react"
import { ChevronDown, ChevronLeft, ChevronRight } from "lucide-react"
import type { ScheduleViewMode } from "@/lib/schedule/types"
import {
  addMonthsToDateKey,
  buildMonthCalendarDays,
  formatCompactWeekRange,
  formatMonthLabel,
  formatWeekRangeLabel,
  isSameWeek,
  listWeeksOverlappingMonth,
  monthFromDateKey,
  startOfMonthDateKey,
  startOfWeekDateKey,
  todayDateKeyInKst,
  WEEKDAY_LABELS_KO,
} from "@/lib/schedule/utils"

type SchedulePeriodPickerProps = {
  label: string
  view: ScheduleViewMode
  dateKey: string
  weekStart: string
  onNavigate: (nextDate: string, nextView?: ScheduleViewMode) => void
}

type PickerTab = "month" | "week"

function YearStepper({
  year,
  onChange,
}: {
  year: number
  onChange: (year: number) => void
}) {
  return (
    <div className="flex items-center justify-center gap-2">
      <button
        type="button"
        onClick={() => onChange(year - 1)}
        className="flex size-8 items-center justify-center rounded-lg border border-border hover:bg-muted"
        aria-label="Previous year"
      >
        <ChevronLeft className="size-4" />
      </button>
      <span className="min-w-[4.5rem] text-center text-sm font-medium text-foreground">
        {year}년
      </span>
      <button
        type="button"
        onClick={() => onChange(year + 1)}
        className="flex size-8 items-center justify-center rounded-lg border border-border hover:bg-muted"
        aria-label="Next year"
      >
        <ChevronRight className="size-4" />
      </button>
    </div>
  )
}

function MonthYearStepper({
  year,
  month,
  onChange,
}: {
  year: number
  month: number
  onChange: (year: number, month: number) => void
}) {
  const anchor = startOfMonthDateKey(year, month)
  const step = (delta: number) => {
    const next = monthFromDateKey(addMonthsToDateKey(anchor, delta))
    onChange(next.year, next.month)
  }

  return (
    <div className="flex items-center justify-center gap-2">
      <button
        type="button"
        onClick={() => step(-1)}
        className="flex size-8 items-center justify-center rounded-lg border border-border hover:bg-muted"
        aria-label="Previous month"
      >
        <ChevronLeft className="size-4" />
      </button>
      <span className="min-w-[7rem] text-center text-sm font-medium text-foreground">
        {formatMonthLabel(year, month)}
      </span>
      <button
        type="button"
        onClick={() => step(1)}
        className="flex size-8 items-center justify-center rounded-lg border border-border hover:bg-muted"
        aria-label="Next month"
      >
        <ChevronRight className="size-4" />
      </button>
    </div>
  )
}

export function SchedulePeriodPicker({
  label,
  view,
  dateKey,
  weekStart,
  onNavigate,
}: SchedulePeriodPickerProps) {
  const popoverId = useId()
  const containerRef = useRef<HTMLDivElement>(null)
  const [open, setOpen] = useState(false)
  const [tab, setTab] = useState<PickerTab>(view === "week" ? "week" : "month")

  const { year: anchorYear, month: anchorMonth } = monthFromDateKey(dateKey)
  const [pickerYear, setPickerYear] = useState(anchorYear)
  const [pickerMonth, setPickerMonth] = useState(anchorMonth)

  const today = todayDateKeyInKst()
  const currentMonth = monthFromDateKey(dateKey)

  useEffect(() => {
    if (!open) return
    setPickerYear(anchorYear)
    setPickerMonth(anchorMonth)
    setTab(view === "week" ? "week" : "month")
  }, [open, anchorYear, anchorMonth, view])

  useEffect(() => {
    if (!open) return
    const onPointerDown = (e: MouseEvent) => {
      if (!containerRef.current?.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false)
    }
    document.addEventListener("mousedown", onPointerDown)
    document.addEventListener("keydown", onKeyDown)
    return () => {
      document.removeEventListener("mousedown", onPointerDown)
      document.removeEventListener("keydown", onKeyDown)
    }
  }, [open])

  const closeAndNavigate = (nextDate: string, nextView?: ScheduleViewMode) => {
    setOpen(false)
    onNavigate(nextDate, nextView)
  }

  const selectMonth = (year: number, month: number) => {
    const first = startOfMonthDateKey(year, month)
    if (view === "month") {
      closeAndNavigate(first, "month")
    } else {
      closeAndNavigate(startOfWeekDateKey(first), "week")
    }
  }

  const selectWeek = (weekStartKey: string) => {
    closeAndNavigate(weekStartKey, "week")
  }

  const selectDayForWeek = (dayKey: string) => {
    closeAndNavigate(startOfWeekDateKey(dayKey), "week")
  }

  const weeks = listWeeksOverlappingMonth(pickerYear, pickerMonth)
  const miniCells = buildMonthCalendarDays(pickerYear, pickerMonth)

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex min-w-[180px] items-center justify-center gap-1 rounded-lg border border-transparent px-2 py-1 font-serif text-lg text-foreground transition-colors hover:border-border hover:bg-muted/50"
        aria-expanded={open}
        aria-controls={popoverId}
        aria-haspopup="dialog"
      >
        <span>{label}</span>
        <ChevronDown
          className={`size-4 text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <div
          id={popoverId}
          role="dialog"
          aria-label="Jump to month or week"
          className="absolute left-1/2 z-50 mt-2 w-[min(100vw-2rem,320px)] -translate-x-1/2 rounded-2xl border border-border bg-background p-4 shadow-lg sm:w-[340px]"
        >
          <div className="mb-3 flex rounded-lg border border-border p-0.5">
            <button
              type="button"
              onClick={() => setTab("month")}
              className={`flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                tab === "month"
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              월
            </button>
            <button
              type="button"
              onClick={() => setTab("week")}
              className={`flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                tab === "week"
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              주
            </button>
          </div>

          {tab === "month" ? (
            <div className="space-y-3">
              <YearStepper year={pickerYear} onChange={setPickerYear} />
              <div className="grid grid-cols-3 gap-2">
                {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => {
                  const isCurrent =
                    pickerYear === currentMonth.year && m === currentMonth.month
                  const isSelected =
                    view === "month" &&
                    pickerYear === anchorYear &&
                    m === anchorMonth
                  return (
                    <button
                      key={m}
                      type="button"
                      onClick={() => selectMonth(pickerYear, m)}
                      className={`rounded-lg border px-2 py-2 text-sm transition-colors hover:bg-muted ${
                        isSelected
                          ? "border-primary bg-primary/10 font-medium text-primary"
                          : isCurrent
                            ? "border-primary/30 bg-primary/5"
                            : "border-border"
                      }`}
                    >
                      {m}월
                    </button>
                  )
                })}
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <MonthYearStepper
                year={pickerYear}
                month={pickerMonth}
                onChange={(y, m) => {
                  setPickerYear(y)
                  setPickerMonth(m)
                }}
              />

              <ul className="max-h-[140px] space-y-1 overflow-y-auto">
                {weeks.map((week) => {
                  const isActive = isSameWeek(dateKey, week.start)
                  return (
                    <li key={week.start}>
                      <button
                        type="button"
                        onClick={() => selectWeek(week.start)}
                        className={`w-full rounded-lg border px-3 py-2 text-left text-sm transition-colors hover:bg-muted ${
                          isActive
                            ? "border-primary bg-primary/10 font-medium text-primary"
                            : "border-border"
                        }`}
                      >
                        {formatCompactWeekRange(week.start, week.end)}
                      </button>
                    </li>
                  )
                })}
              </ul>

              <div>
                <p className="mb-2 text-xs font-medium text-muted-foreground">
                  달력에서 날짜 선택
                </p>
                <div className="overflow-hidden rounded-xl border border-border">
                  <div className="grid grid-cols-7 border-b border-border bg-secondary/40">
                    {WEEKDAY_LABELS_KO.map((d) => (
                      <div
                        key={d}
                        className="py-1 text-center text-[10px] font-medium text-muted-foreground"
                      >
                        {d}
                      </div>
                    ))}
                  </div>
                  <div className="grid grid-cols-7">
                    {miniCells.map((cell, index) => {
                      if (!cell.dateKey) {
                        return (
                          <div
                            key={`empty-${index}`}
                            className="aspect-square border-b border-r border-border"
                          />
                        )
                      }
                      const dayKey = cell.dateKey
                      const dayNum = Number(dayKey.split("-")[2])
                      const isToday = dayKey === today
                      const inSelectedWeek = isSameWeek(dayKey, weekStart)

                      return (
                        <button
                          key={dayKey}
                          type="button"
                          onClick={() => selectDayForWeek(dayKey)}
                          className={`aspect-square border-b border-r border-border text-xs transition-colors hover:bg-muted ${
                            !cell.inMonth ? "text-muted-foreground/60" : ""
                          } ${inSelectedWeek ? "bg-primary/10" : ""}`}
                        >
                          <span
                            className={`inline-flex size-6 items-center justify-center rounded-full ${
                              isToday
                                ? "bg-primary text-primary-foreground"
                                : inSelectedWeek
                                  ? "font-medium text-primary"
                                  : ""
                            }`}
                          >
                            {dayNum}
                          </span>
                        </button>
                      )
                    })}
                  </div>
                </div>
                <p className="mt-2 text-[10px] text-muted-foreground">
                  날짜를 누르면 그 날이 포함된 주(월~일)로 이동합니다.
                </p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
