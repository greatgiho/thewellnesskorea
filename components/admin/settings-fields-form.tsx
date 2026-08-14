"use client"

import { useActionState } from "react"
import { saveSiteSettings } from "@/app/a/(dashboard)/settings/actions"
import type { ActionResult } from "@/lib/errors"

/**
 * One section of the site settings row.
 *
 * The two sections — the footer's own copy and the trader details — are
 * separate forms rather than one long one, so each has its own save button and
 * saving one cannot silently rewrite the other. They post to the same action,
 * which writes only the fields it was given.
 *
 * Inputs are named after their columns. That is what lets the action allowlist
 * them without a second mapping to keep in step.
 */

const FIELD =
  "mt-1.5 w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm text-foreground outline-none transition-colors focus:border-primary"

export type SettingsField = {
  /** Database column, and the input's name. */
  column: string
  label: string
  hint?: string
  multiline?: boolean
}

export function SettingsFieldsForm({
  fields,
  values,
  saved,
}: {
  fields: SettingsField[]
  values: Record<string, string>
  /** What to say after a successful save; the two sections differ. */
  saved: string
}) {
  const [state, formAction, pending] = useActionState<
    ActionResult | null,
    FormData
  >(saveSiteSettings, null)

  return (
    <form action={formAction} className="max-w-md space-y-5">
      {fields.map((f) => (
        <div key={f.column}>
          <label htmlFor={f.column} className="text-sm text-foreground">
            {f.label}
          </label>
          {f.multiline ? (
            <textarea
              id={f.column}
              name={f.column}
              rows={3}
              defaultValue={values[f.column] ?? ""}
              className={`${FIELD} resize-y`}
            />
          ) : (
            <input
              id={f.column}
              name={f.column}
              type="text"
              defaultValue={values[f.column] ?? ""}
              className={FIELD}
            />
          )}
          {f.hint ? (
            <p className="mt-1.5 text-xs text-muted-foreground">{f.hint}</p>
          ) : null}
        </div>
      ))}

      {state && !state.ok ? (
        <p className="rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-foreground">
          {state.error}
        </p>
      ) : null}
      {state?.ok ? (
        <p className="rounded-xl border border-primary/30 bg-primary/10 px-4 py-3 text-sm text-foreground">
          {saved}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={pending}
        className="inline-flex rounded-full bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-60"
      >
        {pending ? "저장하는 중…" : "저장"}
      </button>
    </form>
  )
}
