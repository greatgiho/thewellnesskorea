"use client"

import { useTransition } from "react"
import { deleteReferralLink } from "@/lib/referrals/actions"

/**
 * Deleting a link removes a note about what we printed, not any attribution —
 * bookings keep the code, not the link. The confirm is there because the QR
 * itself may already be on a wall, and the row is how anyone remembers which.
 */
export function DeleteReferralLinkButton({ id }: { id: string }) {
  const [pending, start] = useTransition()

  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => {
        if (!confirm("이 링크를 목록에서 지울까요? 이미 인쇄된 QR은 계속 동작합니다.")) {
          return
        }
        start(() => void deleteReferralLink(id))
      }}
      className="shrink-0 rounded-full border border-border px-3 py-1 text-xs text-muted-foreground transition-colors hover:bg-secondary disabled:opacity-60"
    >
      {pending ? "…" : "지우기"}
    </button>
  )
}
