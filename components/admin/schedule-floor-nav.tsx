"use client"

import type { FloorRow } from "@/lib/schedule/types"
import { floorSwatch } from "@/lib/schedule/floor-colors"

type ScheduleFloorChipsProps = {
  floors: FloorRow[]
  visibleLevels: Set<number>
  onToggleLevel: (level: number) => void
  onShowAll: () => void
}

/**
 * Multi-select floor filter for the month view: "전체" plus one color chip per
 * floor. Toggling a chip shows/hides that floor's sessions.
 */
export function ScheduleFloorChips({
  floors,
  visibleLevels,
  onToggleLevel,
  onShowAll,
}: ScheduleFloorChipsProps) {
  const allVisible = floors.every((f) => visibleLevels.has(f.level))

  return (
    <div className="flex flex-wrap items-center gap-2" aria-label="Floor filter">
      <button
        type="button"
        onClick={onShowAll}
        aria-pressed={allVisible}
        className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
          allVisible
            ? "border-foreground/30 bg-foreground/[0.06] text-foreground"
            : "border-border text-muted-foreground hover:text-foreground"
        }`}
      >
        전체
      </button>
      {floors.map((floor) => {
        const active = visibleLevels.has(floor.level)
        const swatch = floorSwatch(floor.level)
        return (
          <button
            key={floor.id}
            type="button"
            onClick={() => onToggleLevel(floor.level)}
            aria-pressed={active}
            className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
              active
                ? `${swatch.chipActive} text-foreground`
                : "border-border text-muted-foreground opacity-60 hover:opacity-100"
            }`}
          >
            <span className={`size-2 rounded-full ${swatch.dot}`} aria-hidden />
            {floor.name_en}
          </button>
        )
      })}
    </div>
  )
}

type ScheduleFloorNavProps = {
  floors: FloorRow[]
  activeFloorId: string
  onSelect: (floorId: string) => void
}

export function ScheduleFloorNav({
  floors,
  activeFloorId,
  onSelect,
}: ScheduleFloorNavProps) {
  return (
    <nav
      className="flex shrink-0 flex-col gap-1 rounded-2xl border border-border bg-card p-2 sm:w-28"
      aria-label="Floor"
    >
      {floors.map((floor) => {
        const active = floor.id === activeFloorId
        return (
          <button
            key={floor.id}
            type="button"
            onClick={() => onSelect(floor.id)}
            className={`rounded-xl px-3 py-3 text-left transition-colors ${
              active
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-foreground hover:bg-muted"
            }`}
          >
            <span className="flex items-center gap-1.5 text-sm font-medium">
              <span
                className={`size-2 rounded-full ${floorSwatch(floor.level).dot}`}
                aria-hidden
              />
              {floor.name_ko}
            </span>
            <span
              className={`block text-xs ${
                active ? "text-primary-foreground/80" : "text-muted-foreground"
              }`}
            >
              {floor.name_en}
            </span>
          </button>
        )
      })}
    </nav>
  )
}
