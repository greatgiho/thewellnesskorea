"use client"

import Image from "next/image"
import { PATHS, pathLabelKo, type PathKey } from "@/lib/paths/paths-data"
import { getSessionPhotoUrl } from "@/lib/schedule/images"
import type { SessionWithRelations } from "@/lib/schedule/types"
import { SLOT_HEIGHT_PX } from "@/lib/schedule/constants"
import { formatTimeInKst } from "@/lib/schedule/utils"

type ScheduleSessionBlockProps = {
  session: SessionWithRelations
  top: number
  height: number
  onClick: () => void
  variant?: "week" | "day"
}

const PATH_ORDER = new Map(PATHS.map((path) => [path.key, path.order]))

function sortPathKeys(pathKeys: PathKey[]): PathKey[] {
  return [...pathKeys].sort(
    (a, b) => (PATH_ORDER.get(a) ?? 99) - (PATH_ORDER.get(b) ?? 99),
  )
}

function philosophyRibbonLabel(pathKeys: PathKey[]): string {
  const sorted = sortPathKeys(pathKeys)
  if (sorted.length === 1) return pathLabelKo(sorted[0])
  if (sorted.length === 2) {
    return sorted.map(pathLabelKo).join("·")
  }
  return `${pathLabelKo(sorted[0])}·${pathLabelKo(sorted[1])}+${sorted.length - 2}`
}

function PhilosophyCornerRibbon({
  pathKeys,
}: {
  pathKeys: SessionWithRelations["path_keys"]
}) {
  if (!pathKeys?.length) return null

  const sorted = sortPathKeys(pathKeys)
  const label = philosophyRibbonLabel(pathKeys)
  const title = sorted.map(pathLabelKo).join(", ")
  const ribbonWidth = label.length > 4 ? 72 : 58

  return (
    <span
      className="pointer-events-none absolute -left-px -top-px z-20 overflow-hidden"
      style={{ width: 44, height: 44 }}
      title={title}
      aria-hidden
    >
      <span
        className="absolute left-[-14px] top-[10px] block -rotate-45 bg-primary py-0.5 text-center text-[7px] font-semibold leading-tight text-primary-foreground shadow-sm"
        style={{ width: ribbonWidth }}
      >
        {label}
      </span>
    </span>
  )
}

export function ScheduleSessionBlock({
  session,
  top,
  height,
  onClick,
  variant = "week",
}: ScheduleSessionBlockProps) {
  const hasRibbon = (session.path_keys?.length ?? 0) > 0
  const pathSummary = hasRibbon
    ? sortPathKeys(session.path_keys).map(pathLabelKo).join(", ")
    : undefined
  const photoUrl = session.image_paths?.[0]
    ? getSessionPhotoUrl(session.image_paths[0])
    : null
  const instructorName = session.instructor?.name_en ?? "—"
  const showPathLine =
    (session.path_keys?.length ?? 0) > 1 && height >= SLOT_HEIGHT_PX * 1.75

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={
        pathSummary
          ? `${session.title}, ${pathSummary}`
          : session.title
      }
      className="absolute inset-x-0 z-10 overflow-visible p-0 text-left transition-all hover:brightness-95"
      style={{ top, height }}
    >
      <PhilosophyCornerRibbon pathKeys={session.path_keys} />

      <div
        className={`relative h-full w-full overflow-hidden border shadow-sm ${
          variant === "week" ? "rounded-md" : "rounded-lg"
        } ${
          session.is_published
            ? "border-primary/30 bg-primary/15"
            : "border-border bg-secondary/80"
        }`}
      >
        {photoUrl && (
          <Image
            src={photoUrl}
            alt=""
            fill
            className="object-cover opacity-25 grayscale"
            unoptimized
          />
        )}

        <div
          className={`relative z-10 flex h-full flex-col justify-center ${
            variant === "week" ? "px-1.5 py-0.5" : "px-2 py-1"
          } ${hasRibbon ? "pt-3.5" : ""}`}
        >
          {variant === "week" ? (
            <>
              <p className="truncate text-[10px] font-medium text-foreground">
                {session.title}
              </p>
              <p className="truncate text-[9px] text-muted-foreground">
                {formatTimeInKst(session.starts_at)} · {instructorName}
              </p>
              {showPathLine && (
                <p
                  className="truncate text-[8px] text-primary/75"
                  title={pathSummary}
                >
                  {sortPathKeys(session.path_keys).map(pathLabelKo).join(" · ")}
                </p>
              )}
            </>
          ) : (
            <>
              <p className="truncate text-xs font-medium text-foreground">
                {session.title}
              </p>
              <p className="truncate text-[10px] text-muted-foreground">
                {formatTimeInKst(session.starts_at)}–
                {formatTimeInKst(session.ends_at)}
              </p>
              <p className="truncate text-[10px] text-primary/90">
                {instructorName}
              </p>
              {showPathLine && (
                <p
                  className="truncate text-[8px] text-primary/75"
                  title={pathSummary}
                >
                  {sortPathKeys(session.path_keys).map(pathLabelKo).join(" · ")}
                </p>
              )}
            </>
          )}
        </div>
      </div>
    </button>
  )
}
