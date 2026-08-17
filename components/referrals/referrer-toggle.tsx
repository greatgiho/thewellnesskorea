"use client"

import { useTransition } from "react"
import { setReferrerActive } from "@/lib/referrals/actions"

/**
 * Activate / deactivate. Never delete — bookings keep the code as text, so a
 * removed referrer would leave past statements pointing at a name nobody can
 * look up.
 */
export function ReferrerToggle({
  id,
  isActive,
}: {
  id: string
  isActive: boolean
}) {
  const [pending, start] = useTransition()

  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => start(() => void setReferrerActive(id, !isActive))}
      className="inline-flex shrink-0 rounded-full border border-border px-4 py-1.5 text-xs text-muted-foreground transition-colors hover:bg-secondary disabled:opacity-60"
    >
      {pending ? "…" : isActive ? "비활성화" : "다시 활성화"}
    </button>
  )
}
