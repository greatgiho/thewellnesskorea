import { notFound } from "next/navigation"
import { PaymentsClient } from "./payments-client"

// Dev/staging PayPal sandbox harness.
// Shown in local dev always; in production mode (build+start / Vercel) only when
// ENABLE_DEV_PAYMENTS=true. Real Vercel prod leaves the flag unset → 404.
function devPaymentsEnabled(): boolean {
  return (
    process.env.NODE_ENV !== "production" ||
    process.env.ENABLE_DEV_PAYMENTS === "true"
  )
}

export default function DevPaymentsPage() {
  if (!devPaymentsEnabled()) notFound()

  const clientId = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID
  if (!clientId) {
    return (
      <main style={{ maxWidth: 480, margin: "4rem auto", padding: "0 1rem" }}>
        <h1>PayPal Sandbox 테스트</h1>
        <p>
          <code>NEXT_PUBLIC_PAYPAL_CLIENT_ID</code>가 설정되지 않았습니다 (.env.local).
        </p>
      </main>
    )
  }

  return (
    <main style={{ maxWidth: 480, margin: "4rem auto", padding: "0 1rem" }}>
      <h1 style={{ fontSize: 24, marginBottom: 4 }}>PayPal Sandbox 테스트</h1>
      <p style={{ color: "#666", marginBottom: 24 }}>
        고정 금액 $1.00 USD · 샌드박스 구매자 계정으로 로그인해 결제 → capture 확인
      </p>
      <PaymentsClient clientId={clientId} />
    </main>
  )
}
