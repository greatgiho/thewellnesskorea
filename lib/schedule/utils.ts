import {
  SCHEDULE_END_HOUR,
  SCHEDULE_START_HOUR,
  SLOT_HEIGHT_PX,
  SLOT_MINUTES,
  KST_TIMEZONE,
} from "./constants"
import type { SessionRow, SessionWithRelations } from "./types"

export function todayDateKeyInKst(): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: KST_TIMEZONE }).format(
    new Date(),
  )
}

export function formatDateKeyInKst(date: Date): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: KST_TIMEZONE }).format(date)
}

export function addDaysToDateKey(dateKey: string, days: number): string {
  const [y, m, d] = dateKey.split("-").map(Number)
  const utc = new Date(Date.UTC(y, m - 1, d + days))
  return formatDateKeyInKst(utc)
}

export function formatDisplayDate(dateKey: string): string {
  const date = dateKeyToUtcDate(dateKey)
  return new Intl.DateTimeFormat("ko-KR", {
    timeZone: KST_TIMEZONE,
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "short",
  }).format(date)
}

function dateKeyToUtcDate(dateKey: string): Date {
  const [y, m, d] = dateKey.split("-").map(Number)
  return new Date(Date.UTC(y, m - 1, d, 12, 0, 0))
}

export function buildTimeSlots(): string[] {
  const slots: string[] = []
  for (let hour = SCHEDULE_START_HOUR; hour < SCHEDULE_END_HOUR; hour++) {
    for (let minute = 0; minute < 60; minute += SLOT_MINUTES) {
      slots.push(
        `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`,
      )
    }
  }
  return slots
}

export function slotCount(): number {
  return ((SCHEDULE_END_HOUR - SCHEDULE_START_HOUR) * 60) / SLOT_MINUTES
}

export function gridTotalHeightPx(): number {
  return slotCount() * SLOT_HEIGHT_PX
}

export function toKstIso(dateKey: string, time: string): string {
  if (time === "24:00") {
    return toKstIso(addDaysToDateKey(dateKey, 1), "00:00")
  }
  return `${dateKey}T${time}:00+09:00`
}

export function buildTimeOptions(includeMidnightEnd = false): string[] {
  const options: string[] = []
  for (let hour = SCHEDULE_START_HOUR; hour < SCHEDULE_END_HOUR; hour++) {
    for (let minute = 0; minute < 60; minute += SLOT_MINUTES) {
      options.push(
        `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`,
      )
    }
  }
  if (includeMidnightEnd) options.push("24:00")
  return options
}

export function kstDayRange(dateKey: string) {
  return {
    start: toKstIso(dateKey, "00:00"),
    end: toKstIso(addDaysToDateKey(dateKey, 1), "00:00"),
  }
}

export function minutesFromScheduleStart(time: string): number {
  if (time === "24:00") {
    return (SCHEDULE_END_HOUR - SCHEDULE_START_HOUR) * 60
  }
  const [h, m] = time.split(":").map(Number)
  return (h - SCHEDULE_START_HOUR) * 60 + m
}

export function minutesFromScheduleStartIso(iso: string): number {
  const time = formatTimeInKst(iso)
  return minutesFromScheduleStart(time)
}

export function formatTimeInKst(iso: string): string {
  const date = new Date(iso)
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: KST_TIMEZONE,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(date)
}

export function sessionDurationMinutes(session: SessionRow): number {
  const start = new Date(session.starts_at).getTime()
  const end = new Date(session.ends_at).getTime()
  return Math.round((end - start) / 60000)
}

export function sessionTopPx(session: SessionRow): number {
  const minutes = minutesFromScheduleStartIso(session.starts_at)
  return (minutes / SLOT_MINUTES) * SLOT_HEIGHT_PX
}

export function sessionHeightPx(session: SessionRow): number {
  const minutes = sessionDurationMinutes(session)
  return (minutes / SLOT_MINUTES) * SLOT_HEIGHT_PX
}

export function sessionsOverlap(
  aStart: string,
  aEnd: string,
  bStart: string,
  bEnd: string,
): boolean {
  const aS = new Date(aStart).getTime()
  const aE = new Date(aEnd).getTime()
  const bS = new Date(bStart).getTime()
  const bE = new Date(bEnd).getTime()
  return aS < bE && bS < aE
}

export function isWithinOperatingHours(
  dateKey: string,
  startTime: string,
  endTime: string,
): boolean {
  const startMin = minutesFromScheduleStart(startTime)
  const endMin = minutesFromScheduleStart(endTime)
  const maxMin = (SCHEDULE_END_HOUR - SCHEDULE_START_HOUR) * 60
  return startMin >= 0 && endMin <= maxMin && endMin > startMin
}

export function defaultEndTime(startTime: string, durationMinutes = 60): string {
  const startMin = minutesFromScheduleStart(startTime)
  const endMin = startMin + durationMinutes
  const h = SCHEDULE_START_HOUR + Math.floor(endMin / 60)
  const m = endMin % 60
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`
}

export function groupSessionsByFloor(
  sessions: SessionWithRelations[],
): Map<string, SessionWithRelations[]> {
  const map = new Map<string, SessionWithRelations[]>()
  for (const session of sessions) {
    const list = map.get(session.floor_id) ?? []
    list.push(session)
    map.set(session.floor_id, list)
  }
  return map
}

export function dateKeyFromIso(iso: string): string {
  return formatDateKeyInKst(new Date(iso))
}

export function groupSessionsByDateKey(
  sessions: SessionWithRelations[],
): Map<string, SessionWithRelations[]> {
  const map = new Map<string, SessionWithRelations[]>()
  for (const session of sessions) {
    const key = dateKeyFromIso(session.starts_at)
    const list = map.get(key) ?? []
    list.push(session)
    map.set(key, list)
  }
  for (const list of map.values()) {
    list.sort(
      (a, b) =>
        new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime(),
    )
  }
  return map
}

/** Monday-based week in KST */
export function startOfWeekDateKey(dateKey: string): string {
  const date = dateKeyToUtcDate(dateKey)
  const day = date.getUTCDay()
  const diff = day === 0 ? -6 : 1 - day
  return addDaysToDateKey(dateKey, diff)
}

export function endOfWeekDateKey(dateKey: string): string {
  return addDaysToDateKey(startOfWeekDateKey(dateKey), 6)
}

export function buildWeekDateKeys(dateKey: string): string[] {
  const start = startOfWeekDateKey(dateKey)
  return Array.from({ length: 7 }, (_, i) => addDaysToDateKey(start, i))
}

export function addWeeksToDateKey(dateKey: string, weeks: number): string {
  return addDaysToDateKey(dateKey, weeks * 7)
}

export function formatWeekRangeLabel(startKey: string, endKey: string): string {
  const start = dateKeyToUtcDate(startKey)
  const end = dateKeyToUtcDate(endKey)
  const fmt = new Intl.DateTimeFormat("ko-KR", {
    timeZone: KST_TIMEZONE,
    year: "numeric",
    month: "short",
    day: "numeric",
  })
  return `${fmt.format(start)} – ${fmt.format(end)}`
}

export function monthFromDateKey(dateKey: string): { year: number; month: number } {
  const [year, month] = dateKey.split("-").map(Number)
  return { year, month }
}

export function startOfMonthDateKey(year: number, month: number): string {
  return `${year}-${String(month).padStart(2, "0")}-01`
}

export function endOfMonthDateKey(year: number, month: number): string {
  const lastDay = new Date(Date.UTC(year, month, 0)).getUTCDate()
  return `${year}-${String(month).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`
}

export function addMonthsToDateKey(dateKey: string, months: number): string {
  const { year, month } = monthFromDateKey(dateKey)
  const d = new Date(Date.UTC(year, month - 1 + months, 1, 12, 0, 0))
  return formatDateKeyInKst(d)
}

export function formatMonthLabel(year: number, month: number): string {
  const date = new Date(Date.UTC(year, month - 1, 1, 12, 0, 0))
  return new Intl.DateTimeFormat("ko-KR", {
    timeZone: KST_TIMEZONE,
    year: "numeric",
    month: "long",
  }).format(date)
}

export type MonthCalendarCell = {
  dateKey: string | null
  inMonth: boolean
}

export function buildMonthCalendarDays(year: number, month: number): MonthCalendarCell[] {
  const { startDateKey } = monthCalendarRange(year, month)
  const cells: MonthCalendarCell[] = []

  for (let i = 0; i < 42; i++) {
    const dateKey = addDaysToDateKey(startDateKey, i)
    const cellMonth = monthFromDateKey(dateKey).month
    cells.push({ dateKey, inMonth: cellMonth === month })
  }

  return cells
}

export function monthCalendarRange(
  year: number,
  month: number,
): { startDateKey: string; endDateKeyExclusive: string } {
  const first = startOfMonthDateKey(year, month)
  const firstDow = dateKeyToUtcDate(first).getUTCDay()
  const offset = firstDow === 0 ? 6 : firstDow - 1
  const startDateKey = addDaysToDateKey(first, -offset)
  return {
    startDateKey,
    endDateKeyExclusive: addDaysToDateKey(startDateKey, 42),
  }
}

export const WEEKDAY_LABELS_KO = ["월", "화", "수", "목", "금", "토", "일"] as const
