"use client"

import { useState } from "react"
import { saveSessionTiers } from "@/app/a/schedule/tier-actions"
import { saveSessionCoupon } from "@/app/a/schedule/coupon-actions"
import {
  confirmSession,
  deleteSession,
  saveSession,
  unconfirmSession,
} from "@/app/a/schedule/actions"
import type { SessionFormInput, SessionWithRelations } from "@/lib/schedule/types"
import {
  discardUnreferencedUploads,
  uploadSessionImageSlots,
  type SessionImageSlot,
} from "@/components/admin/session-image-upload"

/**
 * Everything that talks to the server about one session, and the two pieces of
 * state that describe an in-flight request.
 *
 * Apart from the form state on purpose: `error` and `pending` are not
 * properties of the class being edited, they are properties of a request. They
 * live here with the only code that sets them, so nothing else can leave the
 * dialog spinning.
 *
 * Every path ends the same way — on success, tell the caller and close; on
 * failure, put the message on screen and leave the form as it was so the work
 * is not lost.
 */

export type UseSessionPersistenceArgs = {
  session?: SessionWithRelations | null
  input: SessionFormInput
  imageSlots: SessionImageSlot[]
  /** Tiers decide capacity; see effectiveCapacityOf. */
  effectiveCapacity: number
  /** Whether the dialog has unsaved edits to write before confirming. */
  isEditing: boolean
  onSaved: () => void
  onClose: () => void
}

export function useSessionPersistence({
  session,
  input,
  imageSlots,
  effectiveCapacity,
  isEditing,
  onSaved,
  onClose,
}: UseSessionPersistenceArgs) {
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState(false)

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

    // Same reason as tiers: a code hangs off a session id. Worth surfacing
    // too — a class that saved without its code looks saved, and the code is
    // the thing somebody was about to send to a person.
    const couponResult = await saveSessionCoupon(
      result.sessionId,
      input.coupon,
      input.price_currency,
    )
    if (!couponResult.ok) throw new Error(couponResult.error)

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

  /** Finish a server call: message on failure, close on success. */
  const settle = (result: { ok: boolean; error?: string }) => {
    if (!result.ok) {
      setError(result.error ?? "Something went wrong.")
    } else {
      onSaved()
      onClose()
    }
    setPending(false)
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
    settle(await confirmSession(session.id))
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
    settle(await unconfirmSession(session.id))
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
    settle(await deleteSession(session.id))
  }

  return { error, setError, pending, setPending, onSubmit, onStatusClick, onDelete }
}
