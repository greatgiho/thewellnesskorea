"use client"

import type { FloorRow } from "@/lib/schedule/types"

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
            <span className="block text-sm font-medium">{floor.name_ko}</span>
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
