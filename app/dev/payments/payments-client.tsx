"use client"

import { useState } from "react"
import { PayPalScriptProvider, PayPalButtons } from "@paypal/react-paypal-js"
import { createPaypalOrder, capturePaypalOrder } from "./actions"

export function PaymentsClient({ clientId }: { clientId: string }) {
  const [log, setLog] = useState<string[]>([])
  const add = (m: string) =>
    setLog((l) => [...l, `${new Date().toISOString().slice(11, 19)}  ${m}`])

  return (
    <PayPalScriptProvider
      options={{ clientId, currency: "USD", intent: "capture" }}
    >
      <PayPalButtons
        style={{ layout: "vertical" }}
        createOrder={async () => {
          const id = await createPaypalOrder()
          add(`order created: ${id}`)
          return id
        }}
        onApprove={async (data) => {
          add(`approved: ${data.orderID}`)
          const res = await capturePaypalOrder(data.orderID)
          add(
            `captured: ${res.status}` +
              (res.captureId ? ` (capture ${res.captureId}, ${res.amount} ${res.currency})` : ""),
          )
        }}
        onCancel={() => add("cancelled by user")}
        onError={(err) => add(`error: ${String(err)}`)}
      />

      <pre
        style={{
          marginTop: "1.5rem",
          padding: "1rem",
          background: "#f4f4f4",
          borderRadius: 8,
          fontSize: 13,
          whiteSpace: "pre-wrap",
          minHeight: 80,
        }}
      >
        {log.length ? log.join("\n") : "로그가 여기 표시됩니다…"}
      </pre>
    </PayPalScriptProvider>
  )
}
