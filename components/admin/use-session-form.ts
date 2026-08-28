"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { useBodyScrollLock } from "@/lib/ui/use-body-scroll-lock"
import { getSessionCoupon } from "@/app/a/schedule/coupon-actions"
import type { PartnerWithPrograms } from "@/lib/partners/types"
import { filterSessionInstructors } from "@/lib/partners/utils"
import type {
  FloorRow,
  SessionFormInput,
  SessionWithRelations,
} from "@/lib/schedule/types"
import {
  childPreviewOf,
  defaultInput,
  discountPreviewOf,
  effectiveCapacityOf,
  inputFromSession,
} from "@/lib/schedule/session-form-input"
import { buildTimeOptions } from "@/lib/schedule/utils"
import {
  slotsFromPaths,
  type SessionImageSlot,
} from "@/components/admin/session-image-upload"
import { useSessionPersistence } from "@/components/admin/use-session-persistence"

/**
 * What the session dialog knows: the form's values, and whether it is being
 * edited or read.
 *
 * The rules for turning a session row into those values live in
 * lib/schedule/session-form-input — pure, and tested, because that is where
 * the child-price null and the tier capacity rules are. The server calls live
 * in useSessionPersistence, with the error and pending flags they own. What is
 * left here is the state itself and keeping it in step with whichever session
 * the dialog was opened on.
 */

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
  const [isEditing, setIsEditing] = useState(false)

  useBodyScrollLock(open)

  const effectiveCapacity = effectiveCapacityOf(input)

  const {
    error,
    setError,
    pending,
    setPending,
    onSubmit,
    onStatusClick,
    onDelete,
  } = useSessionPersistence({
    session,
    input,
    imageSlots,
    effectiveCapacity,
    isEditing,
    onSaved,
    onClose,
  })

  /** Which class the dialog is currently showing, for late arrivals. */
  const openFor = useRef<string | null>(null)

  useEffect(() => {
    if (!open) {
      setPending(false)
      setIsEditing(false)
      return
    }

    // A class that already exists opens for reading; a new one opens ready to
    // type into.
    setIsEditing(!session)

    if (session) {
      setInput(inputFromSession(session, dateKey))
      setImageSlots(slotsFromPaths(session.image_paths ?? []))
      // The code is not on the session row, so it arrives after the rest of
      // the form. Guarded on which class is open: closing this one and opening
      // another while the request is in flight would otherwise stamp one
      // class's code onto another.
      openFor.current = session.id
      const openedFor = session.id
      getSessionCoupon(session.id).then((coupon) => {
        if (openFor.current !== openedFor) return
        setInput((v) => ({ ...v, coupon }))
      })
    } else {
      openFor.current = null
      setInput(
        defaultInput(
          dateKey,
          presetFloorId ?? floors[0]?.id ?? "",
          presetStartTime ?? "09:00",
        ),
      )
      setImageSlots(slotsFromPaths([]))
    }
    setError(null)
    // setError and setPending are stable setState functions; listing them
    // would only add noise.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, session, dateKey, presetFloorId, presetStartTime, floors])

  // Above any early return in the dialog: a hook that runs on some renders and
  // not others is something React rejects outright.
  const discountPreview = useMemo(() => discountPreviewOf(input), [input])
  const childPreview = useMemo(() => childPreviewOf(input), [input])

  const selectedInstructor = partners.find((p) => p.id === input.instructor_id)
  const programs = selectedInstructor?.programs ?? []

  const startOptions = buildTimeOptions()
  const endOptions = buildTimeOptions(true)

  /**
   * Picking a programme fills the class in from it, as a starting point. The
   * intro is only replaced when the programme has one — an admin who has
   * already written something should not lose it to an empty field.
   */
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
