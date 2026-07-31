"use client"

import { useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { ScheduleWeekGrid } from "@/components/admin/schedule-week-grid"
import {
  addDaysToDateKey,
  buildWeekDateKeys,
  formatDisplayDate,
  todayDateKeyInKst,
} from "@/lib/schedule/utils"
import { formatSessionTime } from "@/lib/partner/utils"
import type { FloorRow, SessionWithRelations } from "@/lib/schedule/types"

type Props = {
  weekAnchorDateKey: string
  floors: FloorRow[]
  sessions: SessionWithRelations[]
  initialFloorId: string
}

export function ViewerScheduleClient({
  weekAnchorDateKey,
  floors,
  sessions,
  initialFloorId,
}: Props) {
  const router = useRouter()
  const [floorId, setFloorId] = useState(initialFloorId)
  const [selected, setSelected] = useState<SessionWithRelations | null>(null)

  const weekDays = buildWeekDateKeys(weekAnchorDateKey)
  const go = (dateKey: string) =>
    router.push(`/v?date=${dateKey}&floor=${floorId}`)

  const floorSessions = useMemo(
    () => sessions.filter((s) => s.floor_id === floorId || s.is_all_floors),
    [sessions, floorId],
  )

  // Occupancy is booked seats over offered seats for the week. Unpublished and
  // tentative classes count: a half-planned class still holds the room.
  const occupancy = useMemo(() => {
    const capacity = floorSessions.reduce((sum, s) => sum + (s.capacity ?? 0), 0)
    const booked = floorSessions.reduce((sum, s) => sum + (s.booked_count ?? 0), 0)
    return { capacity, booked, classes: floorSessions.length }
  }, [floorSessions])

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-serif text-2xl text-foreground">
            {formatDisplayDate(weekDays[0])} 주
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            수업 {occupancy.classes}개 · 예약 {occupancy.booked}/
            {occupancy.capacity}석
            {occupancy.capacity > 0
              ? ` (${Math.round((occupancy.booked / occupancy.capacity) * 100)}%)`
              : ""}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => go(addDaysToDateKey(weekAnchorDateKey, -7))}
            className="h-11 rounded-lg border border-border px-3 text-sm text-foreground transition-colors hover:bg-muted sm:h-9"
          >
            ← 이전 주
          </button>
          <button
            type="button"
            onClick={() => go(todayDateKeyInKst())}
            className="h-11 rounded-lg border border-border px-3 text-sm text-foreground transition-colors hover:bg-muted sm:h-9"
          >
            이번 주
          </button>
          <button
            type="button"
            onClick={() => go(addDaysToDateKey(weekAnchorDateKey, 7))}
            className="h-11 rounded-lg border border-border px-3 text-sm text-foreground transition-colors hover:bg-muted sm:h-9"
          >
            다음 주 →
          </button>
        </div>
      </div>

      {floors.length > 1 ? (
        <div className="flex flex-wrap gap-2">
          {floors.map((floor) => (
            <button
              key={floor.id}
              type="button"
              onClick={() => setFloorId(floor.id)}
              className={
                floor.id === floorId
                  ? "rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
                  : "rounded-full border border-border px-4 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted"
              }
            >
              {floor.name_ko}
            </button>
          ))}
        </div>
      ) : null}

      <ScheduleWeekGrid
        weekAnchorDateKey={weekAnchorDateKey}
        floorId={floorId}
        sessions={sessions}
        // Read-only: empty slots are not actionable here, and clicking a class
        // opens details rather than an editor.
        onSlotClick={() => {}}
        onSessionClick={setSelected}
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
          <Row label="시간" value={formatSessionTime(session.starts_at, session.ends_at)} />
          <Row
            label="공간"
            value={
              session.is_all_floors
                ? "전 층 사용"
                : (session.floor?.name_ko ?? "—")
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
