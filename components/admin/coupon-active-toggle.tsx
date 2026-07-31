"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { setCouponActive } from "@/app/a/coupons/actions"

/**
 * Stopping a coupon has to be one click — it is the lever you reach for when
 * a code leaks. Deactivating rather than deleting keeps the redemptions
 * already recorded against it readable.
 */
export function CouponActiveToggle({
  couponId,
  isActive,
}: {
  couponId: string
  isActive: boolean
}) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const toggle = () => {
    const next = !isActive
    if (
      next === false &&
      !window.confirm("이 쿠폰을 즉시 중단할까요? 이후 사용 시도는 모두 거절됩니다.")
    ) {
      return
    }
    setError(null)
    startTransition(async () => {
      const result = await setCouponActive(couponId, next)
      if (!result.ok) {
        setError(result.error ?? "변경하지 못했습니다.")
        return
      }
      router.refresh()
    })
  }

  return (
    <section className="rounded-2xl border border-border bg-card p-6">
      <h2 className="font-mono text-xs uppercase tracking-[0.25em] text-muted-foreground">
        상태
      </h2>
      <div className="mt-4 flex flex-wrap items-center justify-between gap-4">
        <div className="min-w-0">
          <p className="text-sm font-medium text-foreground">
            {isActive ? "활성 — 사용할 수 있습니다." : "중단됨 — 사용할 수 없습니다."}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            중단해도 이미 적용된 예약은 그대로 유지됩니다.
          </p>
        </div>
        <button
          type="button"
          onClick={toggle}
          disabled={pending}
          className={
            isActive
              ? "h-11 shrink-0 rounded-lg bg-destructive/10 px-4 text-sm font-medium text-destructive transition-colors hover:bg-destructive/20 disabled:opacity-60 sm:h-9"
              : "h-11 shrink-0 rounded-lg border border-border px-4 text-sm font-medium text-foreground transition-colors hover:bg-muted disabled:opacity-60 sm:h-9"
          }
        >
          {pending ? "처리 중…" : isActive ? "즉시 중단" : "다시 활성화"}
        </button>
      </div>
      {error ? <p className="mt-3 text-sm text-destructive">{error}</p> : null}
    </section>
  )
}
