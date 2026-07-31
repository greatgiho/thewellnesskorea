"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { collectOnsitePayment } from "@/app/a/onsite-payment-actions"

/**
 * On-site payments are collected in person, so the system only learns about
 * them when someone says so. Until then the booking shows as owing money.
 */
export function OnsitePaymentButton({
  bookingId,
  paid,
}: {
  bookingId: string
  paid: boolean
}) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const toggle = () => {
    if (paid && !window.confirm("수령 처리를 취소할까요? 다시 미수금으로 돌아갑니다.")) {
      return
    }
    setError(null)
    startTransition(async () => {
      const result = await collectOnsitePayment(bookingId, !paid)
      if (!result.ok) {
        setError(result.error)
        return
      }
      router.refresh()
    })
  }

  return (
    <span className="inline-flex items-center gap-2">
      <button
        type="button"
        onClick={toggle}
        disabled={pending}
        className={
          paid
            ? "rounded-lg border border-border px-2.5 py-1 text-xs text-muted-foreground transition-colors hover:bg-muted disabled:opacity-60"
            : "rounded-lg bg-primary px-2.5 py-1 text-xs font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-60"
        }
      >
        {pending ? "…" : paid ? "수령 취소" : "수령 완료"}
      </button>
      {error ? <span className="text-xs text-destructive">{error}</span> : null}
    </span>
  )
}
