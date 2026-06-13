"use client"

import { useEffect, useMemo, useState } from "react"
import { type PathKey } from "@/lib/paths/paths-data"
import type { PersonWithPrograms } from "@/lib/people/types"
import { EMPTY_SESSION_DESCRIPTION } from "@/lib/schedule/images"
import type { FloorRow, SessionFormInput, SessionWithRelations } from "@/lib/schedule/types"
import {
  buildTimeOptions,
  defaultEndTime,
  formatTimeInKst,
} from "@/lib/schedule/utils"
import {
  deleteSession,
  duplicateSession,
  saveSession,
} from "@/app/admin/schedule/actions"
import { PhilosophyPathPicker } from "@/components/admin/philosophy-path-picker"
import { InstructorSearchPicker } from "@/components/admin/instructor-search-picker"
import { SessionDescriptionFields } from "@/components/admin/session-description-fields"
import {
  pathsFromSlots,
  SessionImageUpload,
  slotsFromPaths,
  uploadSessionImageSlots,
  type SessionImageSlot,
} from "@/components/admin/session-image-upload"

type SessionFormDialogProps = {
  open: boolean
  dateKey: string
  floors: FloorRow[]
  people: PersonWithPrograms[]
  session?: SessionWithRelations | null
  presetFloorId?: string
  presetStartTime?: string
  onClose: () => void
  onSaved: () => void
}

const defaultInput = (
  dateKey: string,
  floorId: string,
  startTime: string,
): SessionFormInput => ({
  floor_id: floorId,
  instructor_id: "",
  person_program_id: null,
  title: "",
  path_keys: [],
  date: dateKey,
  start_time: startTime,
  end_time: defaultEndTime(startTime, 60),
  capacity: 12,
  is_published: false,
  image_paths: [],
  description_blocks: { ...EMPTY_SESSION_DESCRIPTION },
})

export function SessionFormDialog({
  open,
  dateKey,
  floors,
  people,
  session,
  presetFloorId,
  presetStartTime,
  onClose,
  onSaved,
}: SessionFormDialogProps) {
  const instructors = useMemo(
    () => people.filter((p) => p.kind === "guide" || p.kind === "both"),
    [people],
  )

  const [input, setInput] = useState<SessionFormInput>(
    defaultInput(dateKey, floors[0]?.id ?? "", "09:00"),
  )
  const [imageSlots, setImageSlots] = useState<SessionImageSlot[]>(
    slotsFromPaths([]),
  )
  const [duplicateDate, setDuplicateDate] = useState(dateKey)
  const [duplicateFloorId, setDuplicateFloorId] = useState(
    floors[0]?.id ?? "",
  )
  const [duplicateStart, setDuplicateStart] = useState("09:00")
  const [duplicateEnd, setDuplicateEnd] = useState(defaultEndTime("09:00", 60))
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState(false)

  useEffect(() => {
    if (!open) return

    if (session) {
      setInput({
        floor_id: session.floor_id,
        instructor_id: session.instructor_id,
        person_program_id: session.person_program_id,
        title: session.title,
        path_keys: session.path_keys ?? [],
        date: dateKey,
        start_time: formatTimeInKst(session.starts_at),
        end_time: formatTimeInKst(session.ends_at),
        capacity: session.capacity,
        is_published: session.is_published,
        image_paths: session.image_paths ?? [],
        description_blocks: session.description_blocks ?? {
          ...EMPTY_SESSION_DESCRIPTION,
        },
      })
      setImageSlots(slotsFromPaths(session.image_paths ?? []))
      setDuplicateDate(dateKey)
      setDuplicateFloorId(session.floor_id)
      setDuplicateStart(formatTimeInKst(session.starts_at))
      setDuplicateEnd(formatTimeInKst(session.ends_at))
    } else {
      const floorId = presetFloorId ?? floors[0]?.id ?? ""
      const start = presetStartTime ?? "09:00"
      setInput(defaultInput(dateKey, floorId, start))
      setImageSlots(slotsFromPaths([]))
    }
    setError(null)
  }, [open, session, dateKey, presetFloorId, presetStartTime, floors])

  const selectedInstructor = people.find((p) => p.id === input.instructor_id)
  const programs = selectedInstructor?.programs ?? []

  const startOptions = buildTimeOptions()
  const endOptions = buildTimeOptions(true)

  const onProgramChange = (programId: string) => {
    if (!programId) {
      setInput((v) => ({ ...v, person_program_id: null }))
      return
    }
    const program = programs.find((p) => p.id === programId)
    if (!program) return
    setInput((v) => ({
      ...v,
      person_program_id: programId,
      title: program.title,
      path_keys: program.path_keys ?? [],
      description_blocks: {
        ...v.description_blocks,
        intro: program.description?.trim() || v.description_blocks.intro,
      },
    }))
  }

  const persistSession = async (): Promise<void> => {
    const pathsBeforeUpload = pathsFromSlots(imageSlots)
    const formInput: SessionFormInput = {
      ...input,
      image_paths: pathsBeforeUpload,
    }
    const id = await saveSession(formInput, session?.id)
    const uploadedPaths = await uploadSessionImageSlots(id, imageSlots)
    if (JSON.stringify(uploadedPaths) !== JSON.stringify(pathsBeforeUpload)) {
      await saveSession({ ...formInput, image_paths: uploadedPaths }, id)
    }
  }

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    if (!input.instructor_id) {
      setError("Select an instructor.")
      return
    }
    setPending(true)
    try {
      await persistSession()
      onSaved()
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save session.")
    } finally {
      setPending(false)
    }
  }

  const onDuplicate = async () => {
    if (!session) return
    setError(null)
    setPending(true)
    try {
      await duplicateSession(session.id, {
        date: duplicateDate,
        floor_id: duplicateFloorId,
        start_time: duplicateStart,
        end_time: duplicateEnd,
        is_published: false,
      })
      onSaved()
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to duplicate session.")
      setPending(false)
    }
  }

  const onDelete = async () => {
    if (!session) return
    if (!confirm(`Delete "${session.title}"?`)) return
    setPending(true)
    try {
      await deleteSession(session.id)
      onSaved()
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete.")
      setPending(false)
    }
  }

  if (!open) return null

  const fieldClass =
    "w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring/50"

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        className="absolute inset-0 bg-foreground/40"
        onClick={onClose}
        aria-label="Close dialog"
      />
      <div className="relative z-10 flex w-full max-w-2xl flex-col rounded-2xl border border-border bg-background shadow-xl max-h-[92vh]">
        <div className="border-b border-border px-6 py-5">
          <h2 className="font-serif text-xl text-foreground">
            {session ? "Edit session" : "New session"}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Schedule · {input.date}
          </p>
        </div>

        <form onSubmit={onSubmit} className="flex flex-col overflow-hidden">
          <div className="space-y-6 overflow-y-auto px-6 py-5">
            {error && (
              <p className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {error}
              </p>
            )}

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block space-y-1.5">
                <span className="text-sm font-medium">Date</span>
                <input
                  type="date"
                  required
                  className={fieldClass}
                  value={input.date}
                  onChange={(e) =>
                    setInput((v) => ({ ...v, date: e.target.value }))
                  }
                />
              </label>
              <label className="block space-y-1.5">
                <span className="text-sm font-medium">Floor</span>
                <select
                  className={fieldClass}
                  value={input.floor_id}
                  onChange={(e) =>
                    setInput((v) => ({ ...v, floor_id: e.target.value }))
                  }
                >
                  {floors.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.name_en} · {f.name_ko}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block space-y-1.5">
                <span className="text-sm font-medium">Start</span>
                <select
                  className={fieldClass}
                  value={input.start_time}
                  onChange={(e) => {
                    const start_time = e.target.value
                    setInput((v) => ({
                      ...v,
                      start_time,
                      end_time: defaultEndTime(start_time, 60),
                    }))
                  }}
                >
                  {startOptions.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </label>
              <label className="block space-y-1.5">
                <span className="text-sm font-medium">End</span>
                <select
                  className={fieldClass}
                  value={input.end_time}
                  onChange={(e) =>
                    setInput((v) => ({ ...v, end_time: e.target.value }))
                  }
                >
                  {endOptions.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </label>
            </div>

            <InstructorSearchPicker
              key={session?.id ?? "new-session"}
              instructors={instructors}
              value={input.instructor_id}
              disabled={pending}
              onChange={(instructorId) =>
                setInput((v) => ({
                  ...v,
                  instructor_id: instructorId,
                  person_program_id: null,
                  title: "",
                  path_keys: [],
                }))
              }
            />

            {selectedInstructor && programs.length > 0 && (
              <label className="block space-y-1.5">
                <span className="text-sm font-medium">Program</span>
                <select
                  className={fieldClass}
                  value={input.person_program_id ?? ""}
                  onChange={(e) => onProgramChange(e.target.value)}
                >
                  <option value="">Custom title</option>
                  {programs.map((p) => (
                    <option key={p.id} value={p.id}>{p.title}</option>
                  ))}
                </select>
                <p className="text-xs text-muted-foreground">
                  Program fills title and paths as a starting point. Session content stays a snapshot.
                </p>
              </label>
            )}

            <label className="block space-y-1.5">
              <span className="text-sm font-medium">Title</span>
              <input
                required
                className={fieldClass}
                value={input.title}
                onChange={(e) =>
                  setInput((v) => ({ ...v, title: e.target.value }))
                }
              />
            </label>

            <div className="space-y-2">
              <span className="text-sm font-medium">Philosophy paths</span>
              <PhilosophyPathPicker
                namePrefix="session"
                value={input.path_keys}
                onChange={(path_keys: PathKey[]) =>
                  setInput((v) => ({ ...v, path_keys }))
                }
              />
            </div>

            <SessionImageUpload
              slots={imageSlots}
              onChange={setImageSlots}
              disabled={pending}
            />

            <SessionDescriptionFields
              value={input.description_blocks}
              onChange={(description_blocks) =>
                setInput((v) => ({ ...v, description_blocks }))
              }
            />

            <label className="block space-y-1.5">
              <span className="text-sm font-medium">Capacity</span>
              <input
                type="number"
                min={1}
                className={fieldClass}
                value={input.capacity}
                onChange={(e) =>
                  setInput((v) => ({ ...v, capacity: Number(e.target.value) }))
                }
              />
            </label>

            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={input.is_published}
                onChange={(e) =>
                  setInput((v) => ({ ...v, is_published: e.target.checked }))
                }
                className="size-4 rounded border-border"
              />
              <span className="text-sm font-medium">Published on site</span>
            </label>

            {session && (
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
                      value={duplicateDate}
                      onChange={(e) => setDuplicateDate(e.target.value)}
                    />
                  </label>
                  <label className="block space-y-1.5">
                    <span className="text-xs font-medium">Floor</span>
                    <select
                      className={fieldClass}
                      value={duplicateFloorId}
                      onChange={(e) => setDuplicateFloorId(e.target.value)}
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
                      value={duplicateStart}
                      onChange={(e) => {
                        const start = e.target.value
                        setDuplicateStart(start)
                        setDuplicateEnd(defaultEndTime(start, 60))
                      }}
                    >
                      {startOptions.map((t) => (
                        <option key={t} value={t}>{t}</option>
                      ))}
                    </select>
                  </label>
                  <label className="block space-y-1.5">
                    <span className="text-xs font-medium">End</span>
                    <select
                      className={fieldClass}
                      value={duplicateEnd}
                      onChange={(e) => setDuplicateEnd(e.target.value)}
                    >
                      {endOptions.map((t) => (
                        <option key={t} value={t}>{t}</option>
                      ))}
                    </select>
                  </label>
                </div>
                <button
                  type="button"
                  disabled={pending}
                  onClick={onDuplicate}
                  className="inline-flex h-9 items-center rounded-lg border border-primary/40 px-4 text-sm font-medium text-primary hover:bg-primary/5 disabled:opacity-50"
                >
                  Duplicate session
                </button>
              </div>
            )}
          </div>

          <div className="flex flex-wrap gap-3 border-t border-border px-6 py-4">
            <button
              type="submit"
              disabled={pending}
              className="inline-flex h-9 items-center rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
            >
              {pending ? "Saving…" : session ? "Save" : "Create"}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="inline-flex h-9 items-center rounded-lg border border-border px-4 text-sm hover:bg-muted"
            >
              Cancel
            </button>
            {session && (
              <button
                type="button"
                onClick={onDelete}
                disabled={pending}
                className="inline-flex h-9 items-center rounded-lg border border-destructive/40 px-4 text-sm text-destructive hover:bg-destructive/10"
              >
                Delete
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  )
}
