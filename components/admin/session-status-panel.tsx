"use client"

import {
  sessionStatusLabel,
  SESSION_STATUS_RIBBON_CLASS,
} from "@/lib/schedule/session-status"
import type { SessionStatus } from "@/lib/schedule/types"

/**
 * The gate between a saved session and a visible one, in one place.
 *
 * A session reaches the public schedule only when it is confirmed *and*
 * published, and the two were far apart: status lived as a small chip in the
 * dialog subtitle that doubled as the confirm button, while the publish
 * checkbox sat at the bottom of the form saying "(confirm session first)"
 * without saying where. A new session showed no chip at all — it saved as
 * processing and closed, giving no sign there was a further step.
 *
 * So the chip states, the button acts, and the sentence under them says what
 * is missing.
 */

type SessionStatusPanelProps = {
  /** null before the session exists — nothing to confirm yet. */
  status: SessionStatus | null
  isPublished: boolean
  onPublishedChange: (next: boolean) => void
  onStatusAction: () => void
  /** Viewing rather than editing. Confirming is not an edit, so it stays open. */
  readOnly: boolean
  pending: boolean
}

function actionLabel(status: SessionStatus | null): string | null {
  if (status === "processing") return "Confirm session"
  if (status === "confirmed") return "Revert to processing"
  return null
}

function explain(status: SessionStatus | null, isPublished: boolean): string | null {
  if (status === null) {
    return "New sessions are created as processing. Confirming one afterwards is what puts it on the public site."
  }
  if (status === "processing") {
    // confirmSessionCore sets is_published itself, so this button is the
    // go-live action rather than a step before one.
    return "Confirming publishes this session to the public site, and cancels anything competing for the slot."
  }
  if (status === "cancelled") {
    return "Cancelled sessions cannot be published."
  }
  return isPublished ? null : "Confirmed, but off the public site until published."
}

export function SessionStatusPanel({
  status,
  isPublished,
  onPublishedChange,
  onStatusAction,
  readOnly,
  pending,
}: SessionStatusPanelProps) {
  const canPublish = status === "confirmed"
  const action = actionLabel(status)
  const note = explain(status, isPublished)

  return (
    <div className="space-y-3 rounded-xl border border-border bg-muted/30 p-4">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm font-medium text-foreground">Status</span>
        <span
          className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${
            SESSION_STATUS_RIBBON_CLASS[status ?? "processing"]
          }`}
        >
          {sessionStatusLabel(status ?? "processing")}
        </span>
        {action && (
          <button
            type="button"
            onClick={onStatusAction}
            disabled={pending}
            className="ml-auto inline-flex h-8 items-center rounded-lg border border-border bg-background px-3 text-sm font-medium hover:bg-muted disabled:opacity-50"
          >
            {action}
          </button>
        )}
      </div>

      <label className="flex items-center gap-3">
        <input
          type="checkbox"
          checked={isPublished}
          disabled={!canPublish || readOnly || pending}
          onChange={(e) => onPublishedChange(e.target.checked)}
          className="size-4 rounded border-border disabled:opacity-50"
        />
        <span className="text-sm font-medium">Published on site</span>
      </label>

      {note && <p className="text-xs text-muted-foreground">{note}</p>}
    </div>
  )
}
