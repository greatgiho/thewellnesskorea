"use client"

import { useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { ScheduleViewBody } from "@/components/schedule/schedule-view-body"
import {
  addDaysToDateKey,
  addMonthsToDateKey,
  addWeeksToDateKey,
  endOfWeekDateKey,
  formatMonthLabel,
  formatWeekRangeLabel,
  startOfWeekDateKey,
  todayDateKeyInKst,
} from "@/lib/schedule/utils"
import { AGENDA_DEFAULT_SPAN_DAYS } from "@/lib/schedule/view-range"
import { formatSessionTime } from "@/lib/partner/utils"
import { FIELD_BASE } from "@/lib/ui/field"
import type {
  FloorRow,
  ScheduleViewMode,
  SessionWithRelations,
} from "@/lib/schedule/types"

type Props = {
  view: ScheduleViewMode
  dateKey: string
  floorSlug: string
  floors: FloorRow[]
  sessions: SessionWithRelations[]
  agendaFrom: string
  agendaTo: string
}

function spanDaysInclusive(from: string, to: string): number {
  const ms = Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)
  return Math.max(1, Math.round(ms / 86_400_000) + 1)
}

/**
 * Read-only counterpart to the admin schedule: same agenda / week / month
 * views via ScheduleViewBody, but clicking a class opens details instead of
 * the editor, and empty slots are not actionable (no onSlotClick is passed).
 */
export function ViewerScheduleClient({
  view,
  dateKey,
  floorSlug,
  floors,
  sessions,
  agendaFrom,
  agendaTo,
}: Props) {
  const router = useRouter()
  const [selected, setSelected] = useState<SessionWithRelations | null>(null)

  const activeFloor = useMemo(
    () => floors.find((f) => f.slug === floorSlug) ?? floors[0],
    [floors, floorSlug],
  )

  const today = todayDateKeyInKst()
  const weekStart = startOfWeekDateKey(dateKey)
  const weekEnd = endOfWeekDateKey(dateKey)
  const agendaSpan = spanDaysInclusive(agendaFrom, agendaTo)

  const go = (
    nextDate: string,
    nextView: ScheduleViewMode = view,
    nextFloor = activeFloor?.slug ?? floorSlug,
  ) =>
    router.push(
      `/v?${new URLSearchParams({ date: nextDate, view: nextView, floor: nextFloor })}`,
    )

  const goAgenda = (from: string, to: string) =>
    router.push(`/v?view=agenda&from=${from}&to=${to}`)

  const setView = (next: ScheduleViewMode) =>
    next === "agenda" ? router.push("/v?view=agenda") : go(dateKey, next)

  // Occupancy over whatever range is on screen. Unpublished and tentative
  // classes count: a half-planned class still holds the room.
  const occupancy = useMemo(() => {
    const shown =
      view === "week"
        ? sessions.filter(
            (s) => s.floor_id === activeFloor?.id || s.is_all_floors,
          )
        : sessions
    return {
      classes: shown.length,
      capacity: shown.reduce((sum, s) => sum + (s.capacity ?? 0), 0),
      booked: shown.reduce((sum, s) => sum + (s.booked_count ?? 0), 0),
    }
  }, [sessions, view, activeFloor])

  if (!activeFloor) {
    return (
      <p className="text-sm text-muted-foreground">
        등록된 공간이 없습니다.
      </p>
    )
  }

  const viewButton = (mode: ScheduleViewMode, label: string) => (
    <button
      type="button"
      onClick={() => setView(mode)}
      className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
        view === mode
          ? "bg-primary text-primary-foreground"
          : "text-muted-foreground hover:text-foreground"
      }`}
    >
      {label}
    </button>
  )

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex rounded-lg border border-border p-0.5">
            {viewButton("agenda", "Agenda")}
            {viewButton("week", "Week")}
            {viewButton("month", "Month")}
          </div>

          {view === "agenda" ? (
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() =>
                  goAgenda(
                    addDaysToDateKey(agendaFrom, -agendaSpan),
                    addDaysToDateKey(agendaTo, -agendaSpan),
                  )
                }
                className="flex size-9 items-center justify-center rounded-lg border border-border hover:bg-muted"
                aria-label="이전 기간"
              >
                <ChevronLeft className="size-4" />
              </button>
              <input
                type="date"
                value={agendaFrom}
                max={agendaTo}
                onChange={(e) => e.target.value && goAgenda(e.target.value, agendaTo)}
                className={FIELD_BASE}
                aria-label="시작일"
              />
              <span className="text-muted-foreground">~</span>
              <input
                type="date"
                value={agendaTo}
                min={agendaFrom}
                onChange={(e) => e.target.value && goAgenda(agendaFrom, e.target.value)}
                className={FIELD_BASE}
                aria-label="종료일"
              />
              <button
                type="button"
                onClick={() =>
                  goAgenda(
                    addDaysToDateKey(agendaFrom, agendaSpan),
                    addDaysToDateKey(agendaTo, agendaSpan),
                  )
                }
                className="flex size-9 items-center justify-center rounded-lg border border-border hover:bg-muted"
                aria-label="다음 기간"
              >
                <ChevronRight className="size-4" />
              </button>
              <button
                type="button"
                onClick={() =>
                  goAgenda(today, addDaysToDateKey(today, AGENDA_DEFAULT_SPAN_DAYS))
                }
                className="text-sm text-primary underline-offset-4 hover:underline"
              >
                오늘
              </button>
            </div>
          ) : (
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() =>
                  go(
                    view === "week"
                      ? addWeeksToDateKey(dateKey, -1)
                      : addMonthsToDateKey(dateKey, -1),
                  )
                }
                className="flex size-9 items-center justify-center rounded-lg border border-border hover:bg-muted"
                aria-label="이전"
              >
                <ChevronLeft className="size-4" />
              </button>
              <span className="min-w-[10rem] text-center text-sm font-medium text-foreground">
                {view === "week"
                  ? formatWeekRangeLabel(weekStart, weekEnd)
                  : formatMonthLabel(
                      Number(dateKey.slice(0, 4)),
                      Number(dateKey.slice(5, 7)),
                    )}
              </span>
              <button
                type="button"
                onClick={() =>
                  go(
                    view === "week"
                      ? addWeeksToDateKey(dateKey, 1)
                      : addMonthsToDateKey(dateKey, 1),
                  )
                }
                className="flex size-9 items-center justify-center rounded-lg border border-border hover:bg-muted"
                aria-label="다음"
              >
                <ChevronRight className="size-4" />
              </button>
              {dateKey !== today && (
                <button
                  type="button"
                  onClick={() => go(today)}
                  className="text-sm text-primary underline-offset-4 hover:underline"
                >
                  오늘
                </button>
              )}
            </div>
          )}
        </div>

        <p className="text-sm text-muted-foreground">
          수업 {occupancy.classes}개 · 예약 {occupancy.booked}/{occupancy.capacity}석
          {occupancy.capacity > 0
            ? ` (${Math.round((occupancy.booked / occupancy.capacity) * 100)}%)`
            : ""}
        </p>
      </div>

      <ScheduleViewBody
        view={view}
        dateKey={dateKey}
        floors={floors}
        sessions={sessions}
        activeFloorId={activeFloor.id}
        onSelectFloor={(floorId) => {
          const floor = floors.find((f) => f.id === floorId)
          if (floor) go(dateKey, view, floor.slug)
        }}
        onSessionClick={setSelected}
        // No onSlotClick / onDayClick: empty slots are not actionable here,
        // and a class opens details rather than an editor.
        weekHint={`${activeFloor.name_ko} · ${activeFloor.name_en} · 월–일 · 06:00–24:00`}
        monthHint="전 층 · 수업을 누르면 상세"
      />

      {selected ? (
        <SessionDetail session={selected} onClose={() => setSelected(null)} />
      ) : null}
    </div>
  )
}

function SessionDetail({
  session,
  onClose,
}: {
  session: SessionWithRelations
  onClose: () => void
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center sm:items-center"
      role="dialog"
      aria-modal="true"
    >
      <button
        type="button"
        className="absolute inset-0 bg-black/40"
        aria-label="닫기"
        onClick={onClose}
      />
      <div className="relative m-4 w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-xl">
        <p className="font-mono text-xs uppercase tracking-[0.25em] text-muted-foreground">
          수업 정보
        </p>
        <h2 className="mt-2 font-serif text-xl text-foreground">
          {session.title}
        </h2>

        <dl className="mt-5 space-y-3 text-sm">
          <Row
            label="시간"
            value={formatSessionTime(session.starts_at, session.ends_at)}
          />
          <Row
            label="공간"
            value={
              session.is_all_floors ? "전 층 사용" : (session.floor?.name_ko ?? "—")
            }
          />
          <Row label="강사" value={session.instructor?.name_ko ?? "—"} />
          <Row
            label="예약"
            value={`${session.booked_count ?? 0}/${session.capacity ?? 0}석`}
          />
          <Row
            label="상태"
            value={`${session.status}${session.is_published ? "" : " · 미게시"}`}
          />
        </dl>

        <button
          type="button"
          onClick={onClose}
          className="mt-6 h-11 w-full rounded-lg border border-border text-sm text-foreground transition-colors hover:bg-muted"
        >
          닫기
        </button>
      </div>
    </div>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-4">
      <dt className="shrink-0 text-muted-foreground">{label}</dt>
      <dd className="min-w-0 text-right text-foreground">{value}</dd>
    </div>
  )
}
