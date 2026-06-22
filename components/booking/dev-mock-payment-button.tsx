"use client"

import { useState, useTransition } from "react"
import Link from "next/link"
import { devMockConfirmPayment } from "@/app/book/actions"

type DevMockPaymentButtonProps = {
  bookingId: string
}

export function DevMockPaymentButton({ bookingId }: DevMockPaymentButtonProps) {
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  const onClick = () => {
    setError(null)
    startTransition(async () => {
      try {
        await devMockConfirmPayment(bookingId)
      } catch (err) {
        setError(err instanceof Error ? err.message : "Payment failed.")
      }
    })
  }

  return (
    <div className="rounded-2xl border border-dashed border-amber-500/40 bg-amber-500/5 p-4">
      <p className="text-sm font-medium text-foreground">Local dev only</p>
      <p className="mt-1 text-xs text-muted-foreground">
        Simulates a successful PG webhook. Requires{" "}
        <code className="rounded bg-muted px-1">PAYMENT_DEV_MOCK=true</code> in
        .env.local.
      </p>
      {error ? (
        <p className="mt-3 text-sm text-destructive">{error}</p>
      ) : null}
      <button
        type="button"
        onClick={onClick}
        disabled={pending}
        className="mt-4 inline-flex rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-60"
      >
        {pending ? "Confirming…" : "Dev: complete payment"}
      </button>
    </div>
  )
}
