"use client"

import { useState } from "react"
import { PayPalScriptProvider, PayPalButtons } from "@paypal/react-paypal-js"
import { captureDrinkOrder, createDrinkOrder, type DrinkReceipt } from "./actions"
import { formatKstDateTime } from "@/lib/time/kst"

/**
 * Pay for a drink, then show what was paid.
 *
 * The receipt lives in state and nowhere else. Nothing is stored, so a refresh
 * loses it — which is fine for the only way this is used: pay at the counter,
 * turn the phone around. Anything longer-lived would need a row to point at.
 */
export function DrinkCheckout({
  drinkId,
  clientId,
  currency,
}: {
  drinkId: string
  clientId: string
  currency: string
}) {
  const [receipt, setReceipt] = useState<DrinkReceipt | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  if (receipt) return <Receipt receipt={receipt} />

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
            return await createDrinkOrder(drinkId)
          }}
          onApprove={async (data) => {
            setBusy(true)
            try {
              const result = await captureDrinkOrder(drinkId, data.orderID)
              if (result.ok) {
                setReceipt(result.receipt)
              } else if (result.pending) {
                setError(
                  "PayPal is reviewing this payment. Please ask our staff before ordering.",
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

/**
 * What staff look at.
 *
 * The time is on it because this is the only thing separating a sale from a
 * screenshot of one — a receipt from an hour ago reads as an hour old.
 */
function Receipt({ receipt }: { receipt: DrinkReceipt }) {
  return (
    <div className="rounded-3xl border border-border bg-card p-6 text-center sm:p-8">
      <p className="font-mono text-xs uppercase tracking-[0.25em] text-muted-foreground">
        Paid
      </p>
      <p className="mt-3 font-serif text-4xl font-light text-foreground">
        {receipt.amount}
      </p>
      <p className="mt-1 text-sm text-muted-foreground">{receipt.name}</p>
      <p className="mt-6 font-mono text-2xl tracking-[0.2em] text-foreground">
        {receipt.code}
      </p>
      <p className="mt-2 text-sm text-muted-foreground">
        {formatKstDateTime(receipt.paidAt, { lang: "en" })} KST
      </p>
    </div>
  )
}
