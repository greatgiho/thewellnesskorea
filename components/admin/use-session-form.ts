"use client"

import { useMemo, useState, useEffect } from "react"
import { useBodyScrollLock } from "@/lib/ui/use-body-scroll-lock"
import { saveSessionTiers } from "@/app/a/schedule/tier-actions"
import type { PathKey } from "@/lib/paths/paths-data"
import type { PartnerWithPrograms } from "@/lib/partners/types"
import { filterSessionInstructors } from "@/lib/partners/utils"
import { EMPTY_SESSION_DESCRIPTION } from "@/lib/schedule/images"
import type {
  FloorRow,
  SessionFormInput,
  SessionWithRelations,
} from "@/lib/schedule/types"
import {
  buildTimeOptions,
  defaultEndTime,
  formatTimeInKst,
} from "@/lib/schedule/utils"
import {
  deleteSession,
  confirmSession,
  saveSession,
  unconfirmSession,
} from "@/app/a/schedule/actions"
import { applyDiscount, discountFrom, money } from "@/lib/payments/money"
import {
  discardUnreferencedUploads,
  slotsFromPaths,
  uploadSessionImageSlots,
  type SessionImageSlot,
} from "@/components/admin/session-image-upload"

/**
 * Everything the session dialog does other than render: form state, keeping
 * that state in step with the session being edited, and the save / confirm /
 * revert / delete calls.
 *
 * Pulled out because the dialog had grown to ~720 lines with 200 of them
 * ahead of the first JSX — the shape of the form was hard to see past the
 * machinery driving it.
 */

export const defaultInput = (
  dateKey: string,
  floorId: string,
  startTime: string,
): SessionFormInput => ({
  floor_id: floorId,
  is_all_floors: false,
  instructor_id: "",
  partner_program_id: null,
  title: "",
  blurb_en: "",
  blurb_ko: "",
  path_keys: [],
  date: dateKey,
  start_time: startTime,
  end_time: defaultEndTime(startTime, 60),
  capacity: 12,
  price_currency: "USD",
  price_amount: 0,
  child_price_amount: null,
  tiers: [],
  discount_type: null,
  discount_value: null,
  is_published: false,
  status: "processing",
  image_paths: [],
  description_blocks: { ...EMPTY_SESSION_DESCRIPTION },
})

export type UseSessionFormArgs = {
  open: boolean
  dateKey: string
  floors: FloorRow[]
  partners: PartnerWithPrograms[]
  session?: SessionWithRelations | null
  presetFloorId?: string
  presetStartTime?: string
  onClose: () => void
  onSaved: () => void
}

export function useSessionForm({
  open,
  dateKey,
  floors,
  partners,
  session,
  presetFloorId,
  presetStartTime,
  onClose,
  onSaved,
}: UseSessionFormArgs) {
  const instructors = useMemo(
    () => filterSessionInstructors(partners),
    [partners],
  )

  const [input, setInput] = useState<SessionFormInput>(
    defaultInput(dateKey, floors[0]?.id ?? "", "09:00"),
  )
  const [imageSlots, setImageSlots] = useState<SessionImageSlot[]>(
    slotsFromPaths([]),
  )
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState(false)
  const [isEditing, setIsEditing] = useState(false)

  useBodyScrollLock(open)

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
        is_all_floors: session.is_all_floors ?? false,
        instructor_id: session.instructor_id,
        partner_program_id: session.partner_program_id,
        title: session.title,
        blurb_en: session.blurb_en ?? "",
        blurb_ko: session.blurb_ko ?? "",
        path_keys: session.path_keys ?? [],
        date: dateKey,
        start_time: formatTimeInKst(session.starts_at),
        end_time: formatTimeInKst(session.ends_at),
        capacity: session.capacity,
        price_currency: session.price_currency ?? "USD",
        price_amount: Number(session.price_amount ?? 0),
        child_price_amount:
          session.child_price_amount != null
            ? Number(session.child_price_amount)
            : null,
        tiers: (session.tiers ?? []).map((t) => ({
          id: t.id,
          code: t.code,
          name: t.name ?? "",
          capacity: t.capacity,
          price_amount: Number(t.price_amount ?? 0),
          child_price_amount:
            t.child_price_amount != null ? Number(t.child_price_amount) : null,
        })),
        discount_type: session.discount_type ?? null,
        discount_value: session.discount_value != null ? Number(session.discount_value) : null,
        is_published: session.is_published,
        status: session.status ?? "confirmed",
        image_paths: session.image_paths ?? [],
        description_blocks: session.description_blocks ?? {
          ...EMPTY_SESSION_DESCRIPTION,
        },
      })
      setImageSlots(slotsFromPaths(session.image_paths ?? []))
    } else {
      const floorId = presetFloorId ?? floors[0]?.id ?? ""
      const start = presetStartTime ?? "09:00"
      setInput(defaultInput(dateKey, floorId, start))
      setImageSlots(slotsFromPaths([]))
    }
    setError(null)
  }, [open, session, dateKey, presetFloorId, presetStartTime, floors])

  // Shows the admin exactly what a customer will see, via the same
  // applyDiscount() the booking screens use.
  //
  // Above the `if (!open) return null` below: a hook after an early return
  // runs on some renders and not others, which React rejects outright.
  const discountPreview = useMemo(() => {
    const discount = discountFrom(input.discount_type, input.discount_value)
    if (!discount) return null
    return applyDiscount(money(input.price_currency, input.price_amount), discount)
  }, [input.discount_type, input.discount_value, input.price_currency, input.price_amount])

  // The same discount comes off the child rate, so it needs its own line: the
  // adult preview says nothing about what a child ends up paying.
  const childPreview = useMemo(() => {
    if (input.child_price_amount === null) return null
    return applyDiscount(
      money(input.price_currency, input.child_price_amount),
      discountFrom(input.discount_type, input.discount_value),
    )
  }, [
    input.child_price_amount,
    input.discount_type,
    input.discount_value,
    input.price_currency,
  ])

  // A tiered class does not have a capacity of its own — it has the sum of
  // its grades, the same rule the database enforces.
  const effectiveCapacity =
    input.tiers.length > 0
      ? input.tiers.reduce((n, t) => n + t.capacity, 0)
      : input.capacity

  const selectedInstructor = partners.find((p) => p.id === input.instructor_id)
  const programs = selectedInstructor?.programs ?? []

  const startOptions = buildTimeOptions()
  const endOptions = buildTimeOptions(true)

  const onProgramChange = (programId: string) => {
    if (!programId) {
      setInput((v) => ({ ...v, partner_program_id: null }))
      return
    }
    const program = programs.find((p) => p.id === programId)
    if (!program) return
    setInput((v) => ({
      ...v,
      partner_program_id: programId,
      title: program.title,
      path_keys: program.path_keys ?? [],
      description_blocks: {
        ...v.description_blocks,
        intro: program.description?.trim() || v.description_blocks.intro,
      },
    }))
  }

  const persistSession = async (): Promise<string> => {
    const sessionId = session?.id ?? crypto.randomUUID()
    const priorPaths = session?.image_paths ?? []
    const { paths, uploaded } = await uploadSessionImageSlots(
      sessionId,
      imageSlots,
      priorPaths,
    )
    const result = await saveSession(
      // Capacity is the tiers' capacity when there are any, so the number
      // written to the session agrees with what set_session_tiers will derive
      // a moment later rather than flickering through the old value.
      { ...input, image_paths: paths, capacity: effectiveCapacity },
      session?.id,
      session?.id ? undefined : sessionId,
    )
    if (!result.ok) {
      // Photos go up before the row exists, under an id this client made. A
      // failed save means that id never becomes a session, so the files would
      // sit in the bucket with nothing able to reach them.
      await discardUnreferencedUploads(uploaded, priorPaths)
      throw new Error(result.error)
    }
    // Tiers hang off a session id, which a new class does not have until the
    // line above. Failing here is worth surfacing: the class would otherwise
    // save at a single price while the form still shows grades.
    const tiersResult = await saveSessionTiers(result.sessionId, input.tiers)
    if (!tiersResult.ok) throw new Error(tiersResult.error)

    return result.sessionId
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

  const onConfirmStatus = async () => {
    if (!session || session.status !== "processing") return
    if (
      !confirm(
        [
          "Confirm this session?",
          // confirmSessionCore publishes as part of confirming, so this click
          // is what puts the session in front of the public.
          "It will go on the public site, and competing sessions in the same slot will be cancelled.",
        ].join("\n\n"),
      )
    ) {
      return
    }
    setError(null)
    setPending(true)
    try {
      if (isEditing) await persistSession()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save session.")
      setPending(false)
      return
    }
    const result = await confirmSession(session.id)
    if (!result.ok) {
      setError(result.error)
    } else {
      onSaved()
      onClose()
    }
    setPending(false)
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
    const result = await unconfirmSession(session.id)
    if (!result.ok) {
      setError(result.error)
    } else {
      onSaved()
      onClose()
    }
    setPending(false)
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
    const result = await deleteSession(session.id)
    if (!result.ok) {
      setError(result.error)
    } else {
      onSaved()
      onClose()
    }
    setPending(false)
  }

  const readOnly = Boolean(session) && !isEditing

  const onRequestClose = () => {
    if (isEditing && session) {
      if (!confirm("Discard unsaved changes and close?")) return
    }
    onClose()
  }


  return {
    // state
    input,
    setInput,
    imageSlots,
    setImageSlots,
    error,
    pending,
    isEditing,
    setIsEditing,
    // derived
    instructors,
    selectedInstructor,
    programs,
    startOptions,
    endOptions,
    discountPreview,
    childPreview,
    effectiveCapacity,
    readOnly,
    // handlers
    onProgramChange,
    onSubmit,
    onStatusClick,
    onDelete,
    onRequestClose,
  }
}
