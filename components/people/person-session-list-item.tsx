import { Clock, MapPin } from "lucide-react"
import { pathLabelKo } from "@/lib/paths/paths-data"
import type { SessionWithRelations } from "@/lib/schedule/types"
import {
  formatDateKeyInKst,
  formatDisplayDate,
  formatTimeInKst,
} from "@/lib/schedule/utils"

type PersonSessionListItemProps = {
  session: SessionWithRelations
}

export function PersonSessionListItem({ session }: PersonSessionListItemProps) {
  const dateKey = formatDateKeyInKst(new Date(session.starts_at))
  const spotsLeft = session.capacity - session.booked_count
  const isFull = spotsLeft <= 0

  return (
    <li className="rounded-2xl border border-border bg-card/60 p-5 transition-colors hover:border-primary/25 hover:bg-card">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 flex-1">
          <p className="text-xs font-medium uppercase tracking-wider text-primary/80">
            {formatDisplayDate(dateKey)}
          </p>
          <h3 className="mt-2 font-serif text-xl font-medium text-foreground">
            {session.title}
          </h3>
          <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-muted-foreground">
            <span className="inline-flex items-center gap-1.5">
              <Clock className="size-3.5 shrink-0" />
              {formatTimeInKst(session.starts_at)} –{" "}
              {formatTimeInKst(session.ends_at)}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <MapPin className="size-3.5 shrink-0" />
              {session.floor?.name_en ?? session.floor?.name_ko ?? "—"}
            </span>
          </div>
          {session.path_keys.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {session.path_keys.map((key) => (
                <span
                  key={key}
                  className="rounded-full border border-primary/20 px-2 py-0.5 text-[0.65rem] uppercase tracking-wider text-primary/80"
                >
                  {pathLabelKo(key)}
                </span>
              ))}
            </div>
          )}
        </div>
        <div className="shrink-0 text-right">
          <span
            className={`text-xs font-medium ${
              isFull ? "text-muted-foreground" : "text-primary"
            }`}
          >
            {isFull ? "Full" : `${spotsLeft} spots left`}
          </span>
        </div>
      </div>
    </li>
  )
}
