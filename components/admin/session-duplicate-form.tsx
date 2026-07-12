"use client"

import { useState } from "react"
import { duplicateSession } from "@/app/admin/schedule/actions"
import type { FloorRow } from "@/lib/schedule/types"
import { buildTimeOptions, defaultEndTime } from "@/lib/schedule/utils"

type SessionDuplicateFormProps = {
  sessionId: string
  initialDate: string
  initialFloorId: string
  initialStart: string
  initialEnd: string
  floors: FloorRow[]
  fieldClass: string
  disabled?: boolean
  onDone: () => void
}

/**
 * "Duplicate this session to another date/floor/time" — a self-contained
 * sub-form with its own state, extracted from SessionFormDialog.
 */
export function SessionDuplicateForm({
  sessionId,
  initialDate,
  initialFloorId,
  initialStart,
  initialEnd,
  floors,
  fieldClass,
  disabled,
  onDone,
}: SessionDuplicateFormProps) {
  const [date, setDate] = useState(initialDate)
  const [floorId, setFloorId] = useState(initialFloorId)
  const [start, setStart] = useState(initialStart)
  const [end, setEnd] = useState(initialEnd)
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const startOptions = buildTimeOptions()
  const endOptions = buildTimeOptions(true)

  const onDuplicate = async () => {
    setError(null)
    setPending(true)
    const result = await duplicateSession(sessionId, {
      date,
      floor_id: floorId,
      start_time: start,
      end_time: end,
    })
    if (!result.ok) {
      setError(result.error)
      setPending(false)
    } else {
      onDone()
    }
  }

  return (
    <div className="rounded-xl border border-border bg-secondary/20 p-4 space-y-4">
      <div>
        <p className="text-sm font-medium text-foreground">
          Duplicate to another slot
        </p>
        <p className="text-xs text-muted-foreground">
          Copies title, photos, and class details. New session is unpublished.
          Images are copied to new files.
        </p>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block space-y-1.5">
          <span className="text-xs font-medium">Date</span>
          <input
            type="date"
            className={fieldClass}
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
        </label>
        <label className="block space-y-1.5">
          <span className="text-xs font-medium">Floor</span>
          <select
            className={fieldClass}
            value={floorId}
            onChange={(e) => setFloorId(e.target.value)}
          >
            {floors.map((f) => (
              <option key={f.id} value={f.id}>
                {f.name_en}
              </option>
            ))}
          </select>
        </label>
        <label className="block space-y-1.5">
          <span className="text-xs font-medium">Start</span>
          <select
            className={fieldClass}
            value={start}
            onChange={(e) => {
              const s = e.target.value
              setStart(s)
              setEnd(defaultEndTime(s, 60))
            }}
          >
            {startOptions.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </label>
        <label className="block space-y-1.5">
          <span className="text-xs font-medium">End</span>
          <select
            className={fieldClass}
            value={end}
            onChange={(e) => setEnd(e.target.value)}
          >
            {endOptions.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </label>
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
      <button
        type="button"
        disabled={pending || disabled}
        onClick={onDuplicate}
        className="inline-flex h-9 items-center rounded-lg border border-primary/40 px-4 text-sm font-medium text-primary hover:bg-primary/5 disabled:opacity-50"
      >
        Duplicate session
      </button>
    </div>
  )
}
