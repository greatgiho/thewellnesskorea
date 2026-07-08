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
                  "결제가 접수되어 검토 중입니다. 확정되면 이메일로 안내드립니다. (예약 내역에서 상태를 확인할 수 있어요.)",
                )
              } else {
                setError(`결제가 완료되지 않았습니다 (${res.status}).`)
              }
            } catch (e) {
              setError(
                e instanceof Error
                  ? e.message
                  : "결제 확정 중 오류가 발생했습니다.",
              )
            } finally {
              setBusy(false)
            }
          }}
          onCancel={() => setError("결제가 취소되었습니다.")}
          onError={() => setError("결제 처리 중 오류가 발생했습니다.")}
        />
      </PayPalScriptProvider>
    </div>
  )
}
