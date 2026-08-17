"use client"

import { X } from "lucide-react"
import type { PartnerWithPrograms } from "@/lib/partners/types"
import type { FloorRow, SessionWithRelations } from "@/lib/schedule/types"
import { SessionDescriptionFields } from "@/components/admin/session-description-fields"
import { SessionDuplicateForm } from "@/components/admin/session-duplicate-form"
import { SessionImageUpload } from "@/components/admin/session-image-upload"
import { SessionStatusPanel } from "@/components/admin/session-status-panel"
import { SessionBookingsPanel } from "@/components/admin/session-bookings-panel"
import { SessionTiersField } from "@/components/admin/session-tiers-field"
import { WhenWhereFields } from "@/components/admin/session-form/when-where-fields"
import { WhoWhatFields } from "@/components/admin/session-form/who-what-fields"
import { PricingFields } from "@/components/admin/session-form/pricing-fields"
import { formatTimeInKst } from "@/lib/schedule/utils"
import { FIELD } from "@/lib/ui/field"
import { useSessionForm } from "@/components/admin/use-session-form"

type SessionFormDialogProps = {
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

/**
 * The dialog itself: the frame, and the order the field groups appear in.
 *
 * Everything that is not the frame lives elsewhere — the state and the save /
 * confirm / delete calls in useSessionForm, the fields in ./session-form. What
 * is left here is the one thing a dialog is for: what the reader sees first,
 * and what they can press at the bottom.
 */
export function SessionFormDialog({
  open,
  dateKey,
  floors,
  partners,
  session,
  presetFloorId,
  presetStartTime,
  onClose,
  onSaved,
}: SessionFormDialogProps) {
  const {
    input,
    setInput,
    imageSlots,
    setImageSlots,
    error,
    pending,
    isEditing,
    setIsEditing,
    instructors,
    selectedInstructor,
    programs,
    startOptions,
    endOptions,
    discountPreview,
    childPreview,
    effectiveCapacity,
    readOnly,
    onProgramChange,
    onSubmit,
    onStatusClick,
    onDelete,
    onRequestClose,
  } = useSessionForm({
    open,
    dateKey,
    floors,
    partners,
    session,
    presetFloorId,
    presetStartTime,
    onClose,
    onSaved,
  })

  if (!open) return null

  const fieldClass = FIELD
  const fields = { input, setInput, fieldClass }

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
          </p>
          {session?.created_by_email && (
            <p className="mt-0.5 text-xs text-muted-foreground">
              Entered by {session.created_by_email}
            </p>
          )}
        </div>

        <form onSubmit={onSubmit} className="flex min-h-0 flex-1 flex-col">
          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-6 py-5">
            {/* Outside the fieldset below: it disables every control it wraps
                while viewing, and confirming a session is not an edit. */}
            <SessionStatusPanel
              status={session?.status ?? null}
              isPublished={input.is_published}
              onPublishedChange={(is_published) =>
                setInput((v) => ({ ...v, is_published }))
              }
              onStatusAction={onStatusClick}
              readOnly={readOnly}
              pending={pending}
            />

            <fieldset
              disabled={readOnly || pending}
              className="mt-6 min-w-0 space-y-6 border-0 p-0 disabled:opacity-100"
            >
              {error && (
                <p className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                  {error}
                </p>
              )}

              <WhenWhereFields
                {...fields}
                floors={floors}
                startOptions={startOptions}
                endOptions={endOptions}
              />

              <WhoWhatFields
                {...fields}
                instructors={instructors}
                allPartners={partners}
                selectedInstructor={selectedInstructor}
                programs={programs}
                disabled={readOnly || pending}
                onProgramChange={onProgramChange}
                instructorKey={session?.id ?? "new-session"}
              />

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

              <PricingFields
                {...fields}
                session={session}
                effectiveCapacity={effectiveCapacity}
                discountPreview={discountPreview}
                childPreview={childPreview}
              />

              <SessionTiersField
                tiers={input.tiers}
                currency={input.price_currency}
                discountType={input.discount_type}
                discountValue={input.discount_value}
                fieldClass={fieldClass}
                onChange={(tiers) => setInput((v) => ({ ...v, tiers }))}
              />

              {session ? (
                <SessionBookingsPanel
                  sessionId={session.id}
                  capacity={session.capacity}
                  bookedCount={session.booked_count}
                  onBookingChange={onSaved}
                />
              ) : null}

              {session && (
                <SessionDuplicateForm
                  sessionId={session.id}
                  initialDate={dateKey}
                  initialFloorId={session.floor_id}
                  initialStart={formatTimeInKst(session.starts_at)}
                  initialEnd={formatTimeInKst(session.ends_at)}
                  floors={floors}
                  fieldClass={fieldClass}
                  disabled={pending}
                  onDone={() => {
                    onSaved()
                    onClose()
                  }}
                />
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
