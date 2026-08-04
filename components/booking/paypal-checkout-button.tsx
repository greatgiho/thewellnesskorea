"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { PayPalScriptProvider, PayPalButtons } from "@paypal/react-paypal-js"
import {
  createBookingPaypalOrder,
  captureBookingPaypalOrder,
} from "@/app/book/paypal-actions"

type Props = {
  bookingId: string
  clientId: string
  currency: string
}

export function PaypalCheckoutButton({ bookingId, clientId, currency }: Props) {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  return (
    <div className="space-y-3">
      {error ? (
        <p className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </p>
      ) : null}
      <PayPalScriptProvider
        options={{ clientId, currency, intent: "capture" }}
      >
        <PayPalButtons
          style={{ layout: "vertical" }}
          disabled={busy}
          createOrder={async () => {
            setError(null)
            return await createBookingPaypalOrder(bookingId)
          }}
          onApprove={async (data) => {
            setBusy(true)
            try {
              const res = await captureBookingPaypalOrder(
                bookingId,
                data.orderID,
              )
              if (res.ok) {
                router.push(`/book/confirm?booking=${bookingId}`)
                router.refresh()
              } else if (res.pending) {
                setError(
                  "Your payment was received and is under review. We'll email you once it's confirmed. (You can check the status in your bookings.)",
                )
              } else {
                setError(`Payment did not complete (${res.status}).`)
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
