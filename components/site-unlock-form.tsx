"use client"

import { useActionState } from "react"
import { unlockSite, type SiteUnlockState } from "@/app/site-unlock/actions"
import { cn } from "@/lib/utils"
import { FIELD_ROOMY } from "@/lib/ui/field"
import { Button } from "@/components/ui/button"

const initialState: SiteUnlockState = {}

const fieldClass = cn(FIELD_ROOMY, "text-center text-lg tracking-[0.35em]")

type SiteUnlockFormProps = {
  nextPath: string
}

export function SiteUnlockForm({ nextPath }: SiteUnlockFormProps) {
  const [state, formAction, pending] = useActionState(unlockSite, initialState)

  return (
    <form action={formAction} className="space-y-5">
      <input type="hidden" name="next" value={nextPath} />
      {state.error && (
        <p className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {state.error}
        </p>
      )}
      <label className="block space-y-2">
        <span className="text-sm font-medium">Access password</span>
        <input
          type="password"
          name="password"
          required
          autoComplete="off"
          inputMode="numeric"
          className={fieldClass}
          placeholder="••••"
        />
      </label>
      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? "Checking…" : "Continue"}
      </Button>
    </form>
  )
}
