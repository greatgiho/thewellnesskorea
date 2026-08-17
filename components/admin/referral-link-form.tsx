"use client"

import { useActionState, useEffect, useRef } from "react"
import { createReferralLink } from "@/app/a/(dashboard)/referrals/actions"
import type { LinkedSession } from "@/lib/referrals/queries"
import type { ActionResult } from "@/lib/errors"

const FIELD =
  "w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground outline-none transition-colors focus:border-primary"

/**
 * Add a link for this partner.
 *
 * A picker rather than a URL box: every link here is either the front page or
 * one class, and letting an address be typed would put a QR nobody can test on
 * a card nobody can recall.
 */
export function ReferralLinkForm({
  referrerId,
  sessions,
}: {
  referrerId: string
  sessions: (LinkedSession & { when: string })[]
}) {
  const [state, formAction, pending] = useActionState<
    ActionResult | null,
    FormData
  >(createReferralLink, null)
  const formRef = useRef<HTMLFormElement>(null)

  useEffect(() => {
    if (state?.ok) formRef.current?.reset()
  }, [state])

  return (
    <form ref={formRef} action={formAction} className="space-y-3">
      <input type="hidden" name="referrerId" value={referrerId} />

      <div className="flex flex-col gap-2 sm:flex-row">
        <select name="sessionId" defaultValue="" className={`${FIELD} sm:flex-1`}>
          <option value="">사이트 홈</option>
          {sessions.map((s) => (
            <option key={s.id} value={s.id}>
              {s.when} · {s.title}
            </option>
          ))}
        </select>

        <input
          name="label"
          className={`${FIELD} sm:w-56`}
          placeholder="어디에 걸 QR인지 (선택)"
        />

        <button
          type="submit"
          disabled={pending}
          className="shrink-0 rounded-full border border-border px-5 py-2 text-sm text-foreground transition-colors hover:bg-secondary disabled:opacity-60"
        >
          {pending ? "…" : "링크 추가"}
        </button>
      </div>

      {state && !state.ok ? (
        <p className="rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-2.5 text-sm text-foreground">
          {state.error}
        </p>
      ) : null}
    </form>
  )
}
