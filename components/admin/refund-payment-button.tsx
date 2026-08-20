"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { refundBookingPayment } from "@/app/a/bookings/actions"

/**
 * What a paid booking looks like in Korean, so 'refunded' does not arrive on
 * the roster as the only English word in the column.
 */
export const PAYMENT_STATUS_LABEL: Record<string, string> = {
  pending: "결제 대기",
  paid: "결제됨",
  failed: "실패",
  cancelled: "취소됨",
  refunded: "환불됨",
}

/**
 * Give the money back, from here rather than PayPal's dashboard.
 *
 * The confirmation spells out that the seat is not released by this. Refunding
 * and cancelling are separate on purpose, and the one time that separation
 * matters is the moment somebody is deciding between them.
 */
export function RefundPaymentButton({
  bookingId,
  guestName,
  amount,
}: {
  bookingId: string
  guestName: string
  amount: string
}) {
  const router = useRouter()
  const [pending, start] = useTransition()
  const [error, setError] = useState<string | null>(null)

  return (
    <span className="inline-flex flex-col items-start gap-1">
      <button
        type="button"
        disabled={pending}
        onClick={() => {
          if (
            !confirm(
              [
                `${guestName} 님의 ${amount}을 환불할까요?`,
                "PayPal로 즉시 환불됩니다. 예약은 취소되지 않으니, 자리를 비우려면 따로 취소해 주세요.",
              ].join("\n\n"),
            )
          ) {
            return
          }
          setError(null)
          start(async () => {
            const result = await refundBookingPayment(bookingId)
            if (!result.ok) setError(result.error)
            else router.refresh()
          })
        }}
        className="rounded-full border border-border px-3 py-1 text-xs text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground disabled:opacity-60"
      >
        {pending ? "…" : "환불"}
      </button>
      {error ? <span className="text-xs text-destructive">{error}</span> : null}
    </span>
  )
}
