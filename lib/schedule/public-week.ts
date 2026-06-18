import { KST_TIMEZONE } from "./constants"
import { addDaysToDateKey, todayDateKeyInKst } from "./utils"

/** Rolling horizon for public schedule (covers pre-announced programs beyond 14 days). */
export const PUBLIC_SCHEDULE_RANGE_DAYS = 60

export function formatScheduleDayHeading(dateKey: string): string {
  const [year, month, day] = dateKey.split("-").map(Number)
  const noonUtc = new Date(Date.UTC(year, month - 1, day, 12, 0, 0))
  return new Intl.DateTimeFormat("en-US", {
    timeZone: KST_TIMEZONE,
    weekday: "long",
    month: "long",
    day: "numeric",
  }).format(noonUtc)
}

export function getPublicScheduleRangeEndKey(startKey?: string): string {
  const start = startKey ?? todayDateKeyInKst()
  return addDaysToDateKey(start, PUBLIC_SCHEDULE_RANGE_DAYS)
}
