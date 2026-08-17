"use client"

import { useState, useTransition } from "react"
import { createPartnerReferrer } from "@/lib/referrals/actions"

/**
 * Make this partner's referral, now that someone wants it.
 *
 * One press, no form: the code comes from the partner's slug, which is already
 * the readable name for them and already on the address of their page. Asking
 * an admin to invent a second name for the same person is a question with no
 * good answer.
 */
export function CreatePartnerReferrerButton({
  partnerId,
  label = "레퍼럴 만들기",
}: {
  partnerId: string
  label?: string
}) {
  const [pending, start] = useTransition()
  const [error, setError] = useState<string | null>(null)

  return (
    <span className="inline-flex flex-wrap items-center gap-2">
      <button
        type="button"
        disabled={pending}
        onClick={() =>
          start(async () => {
            setError(null)
            const result = await createPartnerReferrer(partnerId)
            if (!result.ok) setError(result.error)
          })
        }
        className="shrink-0 rounded-full border border-border px-4 py-1.5 text-xs text-foreground transition-colors hover:bg-secondary disabled:opacity-60"
      >
        {pending ? "만드는 중…" : label}
      </button>
      {error ? (
        <span className="text-xs text-destructive">{error}</span>
      ) : null}
    </span>
  )
}
