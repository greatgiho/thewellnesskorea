import {
  addDaysToDateKey,
  endOfWeekDateKey,
  monthCalendarRange,
  monthFromDateKey,
  startOfWeekDateKey,
  todayDateKeyInKst,
} from "./utils"
import type { ScheduleViewMode } from "./types"

/**
 * Which sessions a schedule screen has to load depends on the view: a month
 * needs the calendar's leading/trailing days, a week needs Mon–Sun, an agenda
 * needs an arbitrary range. Both the admin schedule and the read-only viewer
 * dashboard need the same answer, so the resolution lives here rather than
 * being re-derived per page.
 *
 * Pure: no Supabase, no request context — just query params in, range out.
 */

/** 오늘 포함 7일 */
export const AGENDA_DEFAULT_SPAN_DAYS = 6
/** 약 2달 */
export const AGENDA_MAX_SPAN_DAYS = 61

export type ScheduleSearchParams = {
  date?: string
  view?: string
  from?: string
  to?: string
}

export type ResolvedScheduleView = {
  view: ScheduleViewMode
  dateKey: string
  agendaFrom: string
  agendaTo: string
  /** Inclusive start of the range to query. */
  rangeStart: string
  /** Exclusive end of the range to query. */
  rangeEndExclusive: string
}

function isValidDateKey(value: string | undefined): value is string {
  return typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value)
}

export function resolveScheduleView(
  params: ScheduleSearchParams,
  defaultView: ScheduleViewMode = "month",
): ResolvedScheduleView {
  const dateKey = isValidDateKey(params.date) ? params.date : todayDateKeyInKst()

  const view: ScheduleViewMode =
    params.view === "week"
      ? "week"
      : params.view === "agenda"
        ? "agenda"
        : params.view === "month"
          ? "month"
          : defaultView

  const agendaFrom = isValidDateKey(params.from) ? params.from : todayDateKeyInKst()
  let agendaTo = isValidDateKey(params.to)
    ? params.to
    : addDaysToDateKey(agendaFrom, AGENDA_DEFAULT_SPAN_DAYS)
  // Clamp rather than reject: a hand-edited or stale URL should still render.
  if (agendaTo < agendaFrom) agendaTo = agendaFrom
  const agendaMaxTo = addDaysToDateKey(agendaFrom, AGENDA_MAX_SPAN_DAYS)
  if (agendaTo > agendaMaxTo) agendaTo = agendaMaxTo

  if (view === "agenda") {
    return {
      view,
      dateKey,
      agendaFrom,
      agendaTo,
      rangeStart: agendaFrom,
      rangeEndExclusive: addDaysToDateKey(agendaTo, 1),
    }
  }

  if (view === "week") {
    return {
      view,
      dateKey,
      agendaFrom,
      agendaTo,
      rangeStart: startOfWeekDateKey(dateKey),
      rangeEndExclusive: addDaysToDateKey(endOfWeekDateKey(dateKey), 1),
    }
  }

  const { year, month } = monthFromDateKey(dateKey)
  const range = monthCalendarRange(year, month)
  return {
    view,
    dateKey,
    agendaFrom,
    agendaTo,
    rangeStart: range.startDateKey,
    rangeEndExclusive: range.endDateKeyExclusive,
  }
}
