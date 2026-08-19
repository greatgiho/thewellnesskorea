"use client"

import { useState } from "react"
import { PayPalScriptProvider, PayPalButtons } from "@paypal/react-paypal-js"
import {
  captureDrinkPayment,
  createDrinkPaypalOrder,
  type DrinkReceipt,
} from "./actions"
import { formatKstDateTime } from "@/lib/time/kst"

/**
 * Pay for one rung-up drink, then show what was paid.
 *
 * The receipt is state rather than a redirect. Reloading lands on the page for
 * an order that is now paid, which renders the same facts from the row — so
 * nothing is lost, this just avoids a round trip in front of someone waiting.
 */
export function DrinkCheckout({
  orderId,
  clientId,
  currency,
}: {
  orderId: string
  clientId: string
  currency: string
}) {
  const [receipt, setReceipt] = useState<DrinkReceipt | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  if (receipt) return <PaidReceipt receipt={receipt} />

  return (
    <div className="space-y-3">
      {error ? (
        <p className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </p>
      ) : null}
      <PayPalScriptProvider options={{ clientId, currency, intent: "capture" }}>
        <PayPalButtons
          style={{ layout: "vertical" }}
          disabled={busy}
          createOrder={async () => {
            setError(null)
            return await createDrinkPaypalOrder(orderId)
          }}
          onApprove={async (data) => {
            setBusy(true)
            try {
              const result = await captureDrinkPayment(orderId, data.orderID)
              if (result.ok) {
                setReceipt(result.receipt)
              } else if (result.pending) {
                setError(
                  "PayPal is reviewing this payment. Please show this screen to our staff.",
                )
              } else {
                setError(`Payment did not complete (${result.status}).`)
              }
            } catch (e) {
              setError(
                e instanceof Error
                  ? e.message
                  : "Something went wrong while confirming your payment.",
              )
            } finally {
              setBusy(false)
            }
          }}
          onCancel={() => setError("Payment was cancelled.")}
          onError={() =>
            setError("Something went wrong while processing your payment.")
          }
        />
      </PayPalScriptProvider>
    </div>
  )
}

function PaidReceipt({ receipt }: { receipt: DrinkReceipt }) {
  return (
    <DrinkReceiptCard
      nickname={receipt.nickname}
      name={receipt.name}
      amount={receipt.amount}
      code={receipt.code}
      paidAt={receipt.paidAt}
    />
  )
}

/**
 * What staff look at.
 *
 * The name is the largest thing on it, because that is what gets called out
 * and what a refund is found by. The time is there because it is the only
 * thing separating a sale from a screenshot of one.
 *
 * Exported so the page can render the same card for an order that was already
 * paid before this visit — one receipt, not two that drift apart.
 */
export function DrinkReceiptCard({
  nickname,
  name,
  amount,
  code,
  paidAt,
}: {
  nickname: string
  name: string
  amount: string
  code: string
  paidAt: string | null
}) {
  return (
    <div className="rounded-3xl border border-border bg-card p-6 text-center sm:p-8">
      <p className="font-mono text-xs uppercase tracking-[0.25em] text-muted-foreground">
        Paid
      </p>
      <p className="mt-3 font-serif text-4xl font-light text-foreground">
        {nickname}
      </p>
      <p className="mt-2 text-sm text-muted-foreground">
        {name} · {amount}
      </p>
      <p className="mt-6 font-mono text-2xl tracking-[0.2em] text-foreground">
        {code}
      </p>
      {paidAt ? (
        <p className="mt-2 text-sm text-muted-foreground">
          {formatKstDateTime(paidAt, { lang: "en" })} KST
        </p>
      ) : null}
    </div>
  )
}
