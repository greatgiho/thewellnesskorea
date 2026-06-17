"use client"

import { pathLabelKo } from "@/lib/paths/paths-data"
import type { SessionWithRelations } from "@/lib/schedule/types"
import {
  formatDateKeyInKst,
  formatDisplayDate,
  formatTimeInKst,
} from "@/lib/schedule/utils"

type TeacherSessionCardProps = {
  session: SessionWithRelations
  onClick: () => void
}

export function TeacherSessionCard({
  session,
  onClick,
}: TeacherSessionCardProps) {
  const dateKey = formatDateKeyInKst(new Date(session.starts_at))
  const floorName = session.floor?.name_ko ?? "—"
  const intro = session.description_blocks?.intro?.trim()

  return (
    <button
      type="button"
      onClick={onClick}
      className="group rounded-2xl border border-border bg-card p-5 text-left shadow-sm transition-colors hover:border-primary/30 hover:bg-card/80"
    >
      <p className="text-xs font-medium uppercase tracking-wider text-primary/80">
        {formatDisplayDate(dateKey)}
      </p>
      <h3 className="mt-2 font-serif text-xl text-foreground">{session.title}</h3>
      <dl className="mt-4 space-y-2 text-sm text-muted-foreground">
        <div className="flex gap-2">
          <dt className="shrink-0 text-foreground/70">공간</dt>
          <dd>{floorName}</dd>
        </div>
        <div className="flex gap-2">
          <dt className="shrink-0 text-foreground/70">일시</dt>
          <dd>
            {formatTimeInKst(session.starts_at)} –{" "}
            {formatTimeInKst(session.ends_at)}
          </dd>
        </div>
      </dl>
      {intro && (
        <p className="mt-4 line-clamp-2 text-sm leading-relaxed text-foreground/80">
          {intro}
        </p>
      )}
      {session.path_keys.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-1.5">
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
      <p className="mt-4 text-xs text-primary group-hover:underline">
        자세히 보기
      </p>
    </button>
  )
}
