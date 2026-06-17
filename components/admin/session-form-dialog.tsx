"use client"

import { useEffect, useMemo, useState } from "react"
import { X } from "lucide-react"
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
  confirmSession,
  saveSession,
  unconfirmSession,
} from "@/app/admin/schedule/actions"
import { sessionStatusLabel, SESSION_STATUS_RIBBON_CLASS } from "@/lib/schedule/session-status"
import { PhilosophyPathPicker } from "@/components/admin/philosophy-path-picker"
import { InstructorSearchPicker } from "@/components/admin/instructor-search-picker"
import { SessionDescriptionFields } from "@/components/admin/session-description-fields"
import {
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
  status: "processing",
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
  const [isEditing, setIsEditing] = useState(false)

  useEffect(() => {
    if (!open) return
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = "hidden"
    return () => {
      document.body.style.overflow = previousOverflow
    }
  }, [open])

  useEffect(() => {
    if (!open) {
      setPending(false)
      setIsEditing(false)
      return
    }

    setIsEditing(!session)

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
        status: session.status ?? "confirmed",
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
    const sessionId = session?.id ?? crypto.randomUUID()
    const image_paths = await uploadSessionImageSlots(sessionId, imageSlots)
    await saveSession(
      { ...input, image_paths },
      session?.id,
      session?.id ? undefined : sessionId,
    )
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
      })
      onSaved()
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to duplicate session.")
    } finally {
      setPending(false)
    }
  }

  const onConfirmStatus = async () => {
    if (!session || session.status !== "processing") return
    if (
      !confirm(
        "Confirm this session? Competing sessions in the same slot will be cancelled.",
      )
    ) {
      return
    }
    setError(null)
    setPending(true)
    try {
      if (isEditing) {
        await persistSession()
      }
      await confirmSession(session.id)
      onSaved()
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to confirm session.")
    } finally {
      setPending(false)
    }
  }

  const onRevertStatus = async () => {
    if (!session) return
    const lines = [
      "Revert this session to processing?",
      "Sessions cancelled during confirmation will not be restored.",
    ]
    if (session.is_published) {
      lines.splice(1, 0, "This will remove it from the public site.")
    }
    if (!confirm(lines.join("\n\n"))) return
    setError(null)
    setPending(true)
    try {
      await unconfirmSession(session.id)
      onSaved()
      onClose()
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to revert session.",
      )
    } finally {
      setPending(false)
    }
  }

  const onStatusClick = () => {
    if (!session || pending) return
    if (session.status === "confirmed") void onRevertStatus()
    else if (session.status === "processing") void onConfirmStatus()
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
    } finally {
      setPending(false)
    }
  }

  if (!open) return null

  const fieldClass =
    "w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring/50"

  const isProcessing = input.status === "processing"
  const readOnly = Boolean(session) && !isEditing

  const onRequestClose = () => {
    if (isEditing && session) {
      if (!confirm("Discard unsaved changes and close?")) return
    }
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        className="absolute inset-0 bg-foreground/40"
        onClick={onRequestClose}
        aria-label="Close dialog"
      />
      <div className="relative z-10 flex max-h-[92vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-border bg-background shadow-xl">
        <div className="relative shrink-0 border-b border-border px-6 py-5 pr-14">
          <button
            type="button"
            onClick={onRequestClose}
            className="absolute right-4 top-4 inline-flex size-9 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground"
            aria-label="Close"
          >
            <X className="size-5" />
          </button>
          <h2 className="font-serif text-xl text-foreground">
            {session ? "Edit session" : "New session"}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Schedule · {input.date}
            {session && (
              <>
                {" "}
                ·{" "}
                {session.status === "processing" ||
                session.status === "confirmed" ? (
                  <button
                    type="button"
                    onClick={onStatusClick}
                    disabled={pending}
                    title={
                      session.status === "confirmed"
                        ? "Click to revert to processing"
                        : "Click to confirm session"
                    }
                    className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold transition-opacity hover:opacity-90 disabled:opacity-50 ${SESSION_STATUS_RIBBON_CLASS[session.status]}`}
                  >
                    {sessionStatusLabel(session.status)}
                  </button>
                ) : (
                  <span className="font-medium text-foreground">
                    {sessionStatusLabel(session.status)}
                  </span>
                )}
              </>
            )}
          </p>
          {session?.created_by_email && (
            <p className="mt-0.5 text-xs text-muted-foreground">
              Entered by {session.created_by_email}
            </p>
          )}
        </div>

        <form onSubmit={onSubmit} className="flex min-h-0 flex-1 flex-col">
          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-6 py-5">
            <fieldset
              disabled={readOnly || pending}
              className="min-w-0 space-y-6 border-0 p-0 disabled:opacity-100"
            >
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
              disabled={readOnly || pending}
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
              disabled={readOnly || pending}
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
                disabled={isProcessing || readOnly || pending}
                onChange={(e) =>
                  setInput((v) => ({ ...v, is_published: e.target.checked }))
                }
                className="size-4 rounded border-border disabled:opacity-50"
              />
              <span className="text-sm font-medium">
                Published on site
                {isProcessing && (
                  <span className="ml-1 font-normal text-muted-foreground">
                    (confirm session first)
                  </span>
                )}
              </span>
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
            </fieldset>
          </div>

          <div className="flex shrink-0 flex-wrap gap-3 border-t border-border bg-background px-6 py-4">
            {session && readOnly && (
              <button
                type="button"
                disabled={pending}
                onClick={() => setIsEditing(true)}
                className="inline-flex h-9 items-center rounded-lg border border-border px-4 text-sm font-medium hover:bg-muted disabled:opacity-50"
              >
                Edit
              </button>
            )}
            <button
              type="submit"
              disabled={pending || readOnly}
              className="inline-flex h-9 items-center rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
            >
              {pending ? "Saving…" : session ? "Save" : "Create"}
            </button>
            {session && (
              <button
                type="button"
                onClick={onDelete}
                disabled={pending}
                className="inline-flex h-9 items-center rounded-lg border border-destructive/40 px-4 text-sm text-destructive hover:bg-destructive/10 disabled:opacity-50"
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
