"use client"

import { useEffect, useRef, useState } from "react"

/**
 * Toss's payment widget — what their console now calls 주문서형 — rendered into
 * this page.
 *
 * The other shape, payment().requestPayment(), opens Toss's own window instead.
 * It looks like the simpler option and it is the one this component used first,
 * but it belongs to the older per-MID integration and refuses the
 * 주문서형·결제창형 client key outright:
 *
 *   API 개별 연동 키의 클라이언트 키로 SDK를 연동해주세요.
 *   결제위젯 연동 키는 지원하지 않습니다.
 *
 * Using it would mean swapping the client and secret keys in both projects for
 * the pair Toss labels 기존 결제창. Rendering the widget instead keeps the keys
 * that are already installed, stays on the integration Toss is developing, and
 * brings every enabled method — transfer, virtual account, the -pay wallets —
 * without another change here.
 *
 * The cost is that this can no longer wait for a click: the widget has to be
 * rendered before there is anything to click. So the SDK loads on mount, and
 * the button stays disabled until Toss says the methods are on screen.
 *
 * Nothing here decides what is owed. The amount is rendered from the held
 * payment row and checked again on the server against the database before the
 * charge is confirmed — the return trip goes through the customer's own
 * browser, so this number is not evidence of anything.
 */

const SDK_URL = "https://js.tosspayments.com/v2/standard"

type Widgets = {
  setAmount: (amount: { currency: string; value: number }) => Promise<void>
  renderPaymentMethods: (options: {
    selector: string
    variantKey?: string
  }) => Promise<unknown>
  renderAgreement: (options: {
    selector: string
    variantKey?: string
  }) => Promise<unknown>
  requestPayment: (options: Record<string, unknown>) => Promise<void>
}

type TossPaymentsSdk = ((clientKey: string) => {
  widgets: (options: { customerKey: string }) => Widgets
}) & { ANONYMOUS?: string }

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

    script.addEventListener(
      "load",
      () => {
        if (window.TossPayments) resolve(window.TossPayments)
        else reject(new Error("결제 모듈을 불러오지 못했습니다."))
      },
      { once: true },
    )
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
  const widgetsRef = useRef<Widgets | null>(null)
  const methodsRef = useRef<HTMLDivElement | null>(null)
  const [ready, setReady] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    let cancelled = false

    void (async () => {
      try {
        const TossPayments = await loadSdk()
        if (cancelled) return

        // No stored cards and no billing keys, so there is no customer to
        // recognise between payments. The constant is not the string it looks
        // like — it is "@@ANONYMOUS" — so there is no sensible literal to fall
        // back to, and guessing one would send a customerKey Toss rejects.
        if (!TossPayments.ANONYMOUS) {
          throw new Error("결제 모듈 버전이 예상과 다릅니다.")
        }

        const widgets = TossPayments(clientKey).widgets({
          customerKey: TossPayments.ANONYMOUS,
        })

        // Before rendering, or the methods draw against no amount and the
        // widget refuses the eventual requestPayment.
        await widgets.setAmount({ currency: "KRW", value: amount })
        if (cancelled) return

        // One after the other, methods first. Run as a Promise.all these can
        // resolve with the methods pane still empty, which lights up the pay
        // button over a widget that has nothing in it.
        await widgets.renderPaymentMethods({
          selector: "#toss-payment-methods",
          variantKey: "DEFAULT",
        })
        if (cancelled) return

        // Belt and braces: renderPaymentMethods has been seen to resolve
        // without drawing anything, and a pay button above an empty box is
        // worse than an error message. What is on screen is the thing worth
        // checking, not what the promise said.
        if (!methodsRef.current?.childElementCount) {
          throw new Error(
            "결제 수단을 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.",
          )
        }

        await widgets.renderAgreement({
          selector: "#toss-agreement",
          variantKey: "AGREEMENT",
        })
        if (cancelled) return

        widgetsRef.current = widgets
        setReady(true)
      } catch (e) {
        if (cancelled) return
        setError(
          e instanceof Error
            ? e.message
            : "결제 수단을 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.",
        )
      }
    })()

    return () => {
      cancelled = true
    }
  }, [clientKey, amount])

  const onClick = async () => {
    const widgets = widgetsRef.current
    if (!widgets) return

    setError(null)
    setBusy(true)
    try {
      const origin = window.location.origin
      await widgets.requestPayment({
        orderId,
        // Toss shows this on the receipt and caps it at 100 characters.
        orderName: orderName.slice(0, 100),
        successUrl: `${origin}/book/toss/success`,
        failUrl: `${origin}/book/toss/fail`,
        customerEmail,
        customerName,
      })
      // Nothing after this runs on success — requestPayment navigates away.
    } catch (e) {
      // Closing the window rejects too, which is not worth an error message.
      const cancelled =
        typeof e === "object" &&
        e !== null &&
        "code" in e &&
        (e as { code?: string }).code === "USER_CANCEL"
      if (!cancelled) {
        setError(
          e instanceof Error && e.message
            ? e.message
            : "결제를 시작하지 못했습니다. 잠시 후 다시 시도해 주세요.",
        )
      }
      setBusy(false)
    }
  }

  return (
    <div className="space-y-4">
      {/* Toss renders into these. They must exist before the widget mounts,
          which is why they are not behind the `ready` flag. */}
      <div id="toss-payment-methods" ref={methodsRef} />
      <div id="toss-agreement" />

      {error ? (
        <p className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </p>
      ) : null}

      <button
        type="button"
        onClick={onClick}
        disabled={!ready || busy}
        className="inline-flex w-full items-center justify-center rounded-full bg-primary px-6 py-3.5 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-60"
      >
        {busy ? "결제창을 여는 중…" : ready ? "결제하기" : "결제 수단 불러오는 중…"}
      </button>
    </div>
  )
}
