"use client"

import { useState } from "react"

/**
 * Opens the Toss payment window for a held booking.
 *
 * The SDK is loaded on click rather than on mount. It is a third-party script
 * on a page most visitors reach and some never pay from, and the button has
 * nothing to show while it downloads — waiting until someone means it keeps it
 * off every other render of this page.
 *
 * Loaded from the CDN rather than added as a dependency: Toss ships the SDK as
 * a script and versions it in the URL, and the npm package is a wrapper around
 * the same global.
 *
 * Nothing here decides what is owed. The amount is rendered from the held
 * payment row and handed straight to Toss, and the server checks it again
 * against the database before confirming — the return trip goes through the
 * customer's own browser, so this number is not evidence of anything.
 */

const SDK_URL = "https://js.tosspayments.com/v2/standard"

type TossPaymentsSdk = (clientKey: string) => {
  payment: (options: { customerKey: string }) => {
    requestPayment: (options: Record<string, unknown>) => Promise<void>
  }
}

declare global {
  interface Window {
    TossPayments?: TossPaymentsSdk
  }
}

function loadSdk(): Promise<TossPaymentsSdk> {
  if (window.TossPayments) return Promise.resolve(window.TossPayments)

  return new Promise((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(
      `script[src="${SDK_URL}"]`,
    )
    const script = existing ?? document.createElement("script")

    const onLoad = () => {
      if (window.TossPayments) resolve(window.TossPayments)
      else reject(new Error("결제 모듈을 불러오지 못했습니다."))
    }

    script.addEventListener("load", onLoad, { once: true })
    script.addEventListener(
      "error",
      () => reject(new Error("결제 모듈을 불러오지 못했습니다.")),
      { once: true },
    )

    if (!existing) {
      script.src = SDK_URL
      script.async = true
      document.head.appendChild(script)
    }
  })
}

type Props = {
  clientKey: string
  /** Our merchant_uid. Toss calls it orderId and hands it back untouched. */
  orderId: string
  amount: number
  orderName: string
  customerEmail: string
  customerName: string
}

export function TossCheckoutButton({
  clientKey,
  orderId,
  amount,
  orderName,
  customerEmail,
  customerName,
}: Props) {
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const onClick = async () => {
    setError(null)
    setBusy(true)
    try {
      const TossPayments = await loadSdk()
      const payment = TossPayments(clientKey).payment({
        // No stored cards and no billing keys, so there is no customer to
        // recognise between payments.
        customerKey: "ANONYMOUS",
      })

      const origin = window.location.origin
      await payment.requestPayment({
        method: "CARD",
        amount: { currency: "KRW", value: amount },
        orderId,
        // Toss requires 6-100 characters and shows this on the receipt.
        orderName: orderName.slice(0, 100),
        successUrl: `${origin}/book/toss/success`,
        failUrl: `${origin}/book/toss/fail`,
        customerEmail,
        customerName,
        card: {
          useEscrow: false,
          flowMode: "DEFAULT",
          useCardPoint: false,
          useAppCardOnly: false,
        },
      })
      // Nothing after this runs on success — requestPayment navigates away.
    } catch (e) {
      // Closing the window rejects too, which is not worth an error message.
      const message = e instanceof Error ? e.message : ""
      const cancelled =
        typeof e === "object" &&
        e !== null &&
        "code" in e &&
        (e as { code?: string }).code === "USER_CANCEL"
      if (!cancelled) {
        setError(message || "결제를 시작하지 못했습니다. 잠시 후 다시 시도해 주세요.")
      }
      setBusy(false)
    }
  }

  return (
    <div className="space-y-3">
      {error ? (
        <p className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </p>
      ) : null}
      <button
        type="button"
        onClick={onClick}
        disabled={busy}
        className="inline-flex w-full items-center justify-center rounded-full bg-primary px-6 py-3.5 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-60"
      >
        {busy ? "결제창을 여는 중…" : "카드로 결제하기"}
      </button>
    </div>
  )
}
