import type { PartnerActivityRegionRow } from "@/lib/regions/types"
import { formatActivityRegionLabel } from "@/lib/regions/utils"
import type { RegionRow } from "@/lib/regions/types"

type ActivityRegionDisplayProps = {
  regions: PartnerActivityRegionRow[] | undefined
  sido: RegionRow[]
  locale?: "ko" | "en"
  emptyLabel?: string
}

export function ActivityRegionDisplay({
  regions,
  sido,
  locale = "ko",
  emptyLabel = "—",
}: ActivityRegionDisplayProps) {
  const sidoByCode = new Map(sido.map((row) => [row.code, row]))
  const entries = [...(regions ?? [])].sort((a, b) => a.priority - b.priority)

  if (entries.length === 0) {
    return <p className="text-sm text-muted-foreground">{emptyLabel}</p>
  }

  return (
    <ul className="space-y-2">
      {entries.map((entry) => {
        const label = formatActivityRegionLabel(entry, sidoByCode, locale)
        return (
          <li key={entry.priority} className="flex items-start gap-3 text-sm">
            <span className="mt-0.5 inline-flex size-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[0.65rem] font-medium text-primary">
              {entry.priority}
            </span>
            <span className="text-foreground">{label ?? entry.region_code}</span>
          </li>
        )
      })}
    </ul>
  )
}
