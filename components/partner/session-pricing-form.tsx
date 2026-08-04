"use client"

import { useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { saveSessionPricing, type PricingInput } from "@/app/p/session-pricing-actions"
import { applyDiscount, discountFrom, money } from "@/lib/payments/money"
import { PriceTag } from "@/components/booking/price-tag"
import { FIELD } from "@/lib/ui/field"

export function SessionPricingForm({
  sessionId,
  initial,
}: {
  sessionId: string
  initial: PricingInput
}) {
  const router = useRouter()
  const [input, setInput] = useState<PricingInput>(initial)
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)
  const [pending, setPending] = useState(false)

  const set = <K extends keyof PricingInput>(key: K, value: PricingInput[K]) => {
    setInput((v) => ({ ...v, [key]: value }))
    setSaved(false)
  }

  // Exactly what a customer will see — same helper the booking page uses.
  const preview = useMemo(
    () =>
      applyDiscount(
        money(input.priceCurrency, input.priceAmount),
        discountFrom(input.discountType, input.discountValue),
      ),
    [input],
  )

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setPending(true)
    const result = await saveSessionPricing(sessionId, input)
    setPending(false)
    if (!result.ok) {
      setError(result.error)
      return
    }
    setSaved(true)
    router.refresh()
  }

  return (
    <form onSubmit={onSubmit} className="max-w-xl space-y-5">
      <label className="block space-y-1">
        <span className="text-sm font-medium">가격</span>
        <div className="flex gap-2">
          <select
            className={FIELD}
            value={input.priceCurrency}
            onChange={(e) => set("priceCurrency", e.target.value as "KRW" | "USD")}
          >
            <option value="USD">USD</option>
            <option value="KRW">KRW</option>
          </select>
          <input
            type="number"
            min={0}
            step={input.priceCurrency === "KRW" ? 1000 : 1}
            className={FIELD}
            value={input.priceAmount}
            onChange={(e) => set("priceAmount", Math.max(0, Number(e.target.value) || 0))}
          />
        </div>
        <span className="block text-xs text-muted-foreground">
          0원이면 무료 수업입니다. USD는 온라인 카드 결제, 그 외 통화는 현장
          결제로 진행됩니다.
        </span>
      </label>

      <label className="block space-y-1">
        <span className="text-sm font-medium">할인</span>
        <div className="flex gap-2">
          <select
            className={FIELD}
            value={input.discountType ?? ""}
            onChange={(e) => {
              const type = e.target.value as "" | "fixed" | "percent"
              setInput((v) => ({
                ...v,
                discountType: type === "" ? null : type,
                discountValue: type === "" ? null : (v.discountValue ?? 0),
              }))
              setSaved(false)
            }}
          >
            <option value="">없음</option>
            <option value="percent">정률 (%)</option>
            <option value="fixed">정액 ({input.priceCurrency})</option>
          </select>
          <input
            type="number"
            min={0}
            max={input.discountType === "percent" ? 100 : input.priceAmount}
            step={
              input.discountType === "percent"
                ? 1
                : input.priceCurrency === "KRW"
                  ? 1000
                  : 1
            }
            disabled={input.discountType === null}
            className={FIELD}
            value={input.discountValue ?? ""}
            onChange={(e) => set("discountValue", Math.max(0, Number(e.target.value) || 0))}
          />
        </div>
      </label>

      <div className="rounded-2xl border border-border bg-card px-5 py-4">
        <p className="font-mono text-xs uppercase tracking-[0.25em] text-muted-foreground">
          고객 화면
        </p>
        <p className="mt-2 text-lg">
          <PriceTag priced={preview} />
        </p>
        <p className="mt-2 text-xs text-muted-foreground">
          쿠폰이 이보다 유리하면 쿠폰이, 아니면 이 가격이 적용됩니다. 둘이
          겹쳐서 깎이지는 않습니다.
        </p>
      </div>

      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      {saved ? <p className="text-sm text-primary">저장했습니다.</p> : null}

      <button
        type="submit"
        disabled={pending}
        className="h-11 rounded-lg bg-primary px-5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-60 sm:h-9"
      >
        {pending ? "저장 중…" : "저장"}
      </button>
    </form>
  )
}
