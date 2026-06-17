"use client"

import Image from "next/image"
import { useEffect } from "react"
import { pathLabelKo } from "@/lib/paths/paths-data"
import { getSessionPhotoUrl } from "@/lib/schedule/images"
import type { SessionWithRelations } from "@/lib/schedule/types"
import {
  formatDateKeyInKst,
  formatDisplayDate,
  formatTimeInKst,
} from "@/lib/schedule/utils"

type TeacherSessionDetailProps = {
  session: SessionWithRelations | null
  onClose: () => void
}

function DescriptionBlock({
  label,
  text,
}: {
  label: string
  text: string
}) {
  if (!text.trim()) return null
  return (
    <div>
      <h4 className="text-sm font-medium text-foreground">{label}</h4>
      <p className="mt-1 whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">
        {text}
      </p>
    </div>
  )
}

export function TeacherSessionDetail({
  session,
  onClose,
}: TeacherSessionDetailProps) {
  useEffect(() => {
    if (!session) return
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose()
    }
    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [session, onClose])

  if (!session) return null

  const dateKey = formatDateKeyInKst(new Date(session.starts_at))
  const blocks = session.description_blocks ?? {
    intro: "",
    progress: "",
    preparation: "",
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-4 sm:items-center"
      role="presentation"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="session-detail-title"
        className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-border bg-background p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-primary/80">
              {formatDisplayDate(dateKey)}
            </p>
            <h2
              id="session-detail-title"
              className="mt-1 font-serif text-2xl text-foreground"
            >
              {session.title}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg px-2 py-1 text-sm text-muted-foreground hover:bg-muted hover:text-foreground"
            aria-label="닫기"
          >
            ✕
          </button>
        </div>

        <dl className="mt-5 space-y-2 text-sm">
          <div className="flex gap-2">
            <dt className="w-14 shrink-0 text-muted-foreground">공간</dt>
            <dd className="text-foreground">
              {session.floor?.name_ko ?? "—"}
              {session.floor?.name_en && (
                <span className="text-muted-foreground">
                  {" "}
                  ({session.floor.name_en})
                </span>
              )}
            </dd>
          </div>
          <div className="flex gap-2">
            <dt className="w-14 shrink-0 text-muted-foreground">일시</dt>
            <dd className="text-foreground">
              {formatTimeInKst(session.starts_at)} –{" "}
              {formatTimeInKst(session.ends_at)}
            </dd>
          </div>
          <div className="flex gap-2">
            <dt className="w-14 shrink-0 text-muted-foreground">정원</dt>
            <dd className="text-foreground">
              {session.booked_count} / {session.capacity}
            </dd>
          </div>
        </dl>

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

        {session.image_paths.length > 0 && (
          <div className="mt-5 grid gap-2 sm:grid-cols-2">
            {session.image_paths.map((path) => (
              <div
                key={path}
                className="relative aspect-[4/3] overflow-hidden rounded-xl bg-muted"
              >
                <Image
                  src={getSessionPhotoUrl(path)}
                  alt=""
                  fill
                  className="object-cover"
                />
              </div>
            ))}
          </div>
        )}

        <div className="mt-6 space-y-4">
          <DescriptionBlock label="소개" text={blocks.intro} />
          <DescriptionBlock label="진행" text={blocks.progress} />
          <DescriptionBlock label="준비" text={blocks.preparation} />
        </div>
      </div>
    </div>
  )
}
