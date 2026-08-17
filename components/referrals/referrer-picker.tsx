"use client"

import { useActionState, useEffect, useRef } from "react"
import { createReferralLink } from "@/lib/referrals/actions"
import type { Referrer } from "@/lib/referrals/queries"
import type { ActionResult } from "@/lib/errors"
import { NewReferrerForm } from "@/components/referrals/new-referrer-form"

const FIELD =
  "w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground outline-none transition-colors focus:border-primary"

/**
 * Add someone to this class.
 *
 * Only referrers that are still active are offered: a retired partner's
 * existing links keep working and keep being counted, but nobody should be
 * handed a new QR for one.
 *
 * Making a seed is folded in rather than left to its own tab. Otherwise the
 * common case is "open the class, find the person missing, go to another
 * screen, come back and start again" — and the seed tab exists to manage
 * seeds, not to be a detour on the way here.
 */
export function ReferrerPicker({
  sessionId,
  choices,
}: {
  sessionId: string
  choices: Referrer[]
}) {
  const [state, formAction, pending] = useActionState<
    ActionResult | null,
    FormData
  >(createReferralLink, null)
  const formRef = useRef<HTMLFormElement>(null)

  useEffect(() => {
    if (state?.ok) formRef.current?.reset()
  }, [state])

  if (choices.length === 0) {
    return (
      <div className="space-y-3">
        <p className="text-sm text-muted-foreground">
          고를 대상이 없습니다. 새로 만들거나, 선생 탭에서 선생의 레퍼럴을 먼저
          만드세요.
        </p>
        <NewSeed />
      </div>
    )
  }

  return (
    <form ref={formRef} action={formAction} className="space-y-3">
      <input type="hidden" name="sessionId" value={sessionId} />

      <div className="flex flex-col gap-2 sm:flex-row">
        <select
          name="referrerId"
          required
          defaultValue=""
          className={`${FIELD} sm:flex-1`}
        >
          <option value="" disabled>
            누가 소개할지 고르세요
          </option>
          {choices.map((r) => (
            <option key={r.id} value={r.id}>
              {r.name} ({r.code})
            </option>
          ))}
        </select>

        <input
          name="label"
          className={`${FIELD} sm:w-56`}
          placeholder="어디에 올릴지 (선택)"
        />

        <button
          type="submit"
          disabled={pending}
          className="shrink-0 rounded-full border border-border px-5 py-2 text-sm text-foreground transition-colors hover:bg-secondary disabled:opacity-60"
        >
          {pending ? "…" : "레퍼럴 추가"}
        </button>
      </div>

      {state && !state.ok ? (
        <p className="rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-2.5 text-sm text-foreground">
          {state.error}
        </p>
      ) : null}

      <NewSeed />
    </form>
  )
}

/**
 * Collapsed by default: most of the time the person is already in the list,
 * and an open form on every class card would bury the classes.
 */
function NewSeed() {
  return (
    <details className="group">
      <summary className="inline-flex cursor-pointer select-none list-none text-xs text-muted-foreground underline-offset-4 hover:text-foreground hover:underline">
        + 새 시드 만들기
      </summary>
      <div className="mt-4 rounded-2xl border border-border/70 p-4">
        <NewReferrerForm />
      </div>
    </details>
  )
}
