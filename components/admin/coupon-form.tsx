"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { saveCoupon, type CouponInput } from "@/app/a/coupons/actions"
import { FIELD } from "@/lib/ui/field"
import type { CouponRow } from "@/lib/coupons/admin-queries"
import { fromLocalInput, toLocalInput } from "@/lib/coupons/local-datetime"

const emptyInput: CouponInput = {
  code: "",
  discountType: "percent",
  discountValue: 10,
  currency: null,
  startsAt: null,
  endsAt: null,
  maxRedemptions: null,
  maxPerUser: null,
  isActive: true,
  note: null,
}

export function CouponForm({ coupon }: { coupon?: CouponRow }) {
  const router = useRouter()
  const [input, setInput] = useState<CouponInput>(
    coupon
      ? {
          code: coupon.code,
          discountType: coupon.discountType,
          discountValue: coupon.discountValue,
          currency: (coupon.currency as "KRW" | "USD" | null) ?? null,
          startsAt: toLocalInput(coupon.startsAt),
          endsAt: toLocalInput(coupon.endsAt),
          maxRedemptions: coupon.maxRedemptions,
          maxPerUser: coupon.maxPerUser,
          isActive: coupon.isActive,
          note: coupon.note,
        }
      : emptyInput,
  )
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState(false)

  const set = <K extends keyof CouponInput>(key: K, value: CouponInput[K]) =>
    setInput((v) => ({ ...v, [key]: value }))

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setPending(true)
    // The two datetime fields hold the admin's own wall clock. Converted here
    // rather than in the action, because only the browser knows which clock
    // that is — see lib/coupons/local-datetime.
    const result = await saveCoupon(
      {
        ...input,
        startsAt: fromLocalInput(input.startsAt),
        endsAt: fromLocalInput(input.endsAt),
      },
      coupon?.id,
    )
    setPending(false)
    if (!result.ok) {
      setError(result.error)
      return
    }
    router.push(`/a/coupons/${result.id}`)
    router.refresh()
  }

  // A number input that means "no limit" when blank, not zero.
  const optionalNumber = (
    label: string,
    key: "maxRedemptions" | "maxPerUser",
    hint: string,
  ) => (
    <label className="block space-y-1">
      <span className="text-sm font-medium">{label}</span>
      <input
        type="number"
        min={1}
        className={FIELD}
        value={input[key] ?? ""}
        placeholder="무제한"
        onChange={(e) =>
          set(key, e.target.value === "" ? null : Math.max(1, Number(e.target.value) || 1))
        }
      />
      <span className="block text-xs text-muted-foreground">{hint}</span>
    </label>
  )

  return (
    <form onSubmit={onSubmit} className="max-w-2xl space-y-5">
      <label className="block space-y-1">
        <span className="text-sm font-medium">코드</span>
        <input
          className={`${FIELD} font-mono uppercase`}
          value={input.code}
          onChange={(e) => set("code", e.target.value)}
          placeholder="SUMMER50"
          required
        />
        <span className="block text-xs text-muted-foreground">
          대소문자·앞뒤 공백은 무시됩니다. 영문·숫자·하이픈·밑줄만 사용하세요.
        </span>
      </label>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block space-y-1">
          <span className="text-sm font-medium">할인 방식</span>
          <select
            className={FIELD}
            value={input.discountType}
            onChange={(e) => {
              const type = e.target.value as "percent" | "fixed"
              set("discountType", type)
              // A percentage has no currency; a fixed amount needs one.
              set("currency", type === "fixed" ? (input.currency ?? "USD") : null)
            }}
          >
            <option value="percent">정률 (%)</option>
            <option value="fixed">정액</option>
          </select>
        </label>

        <label className="block space-y-1">
          <span className="text-sm font-medium">할인 값</span>
          <div className="flex gap-2">
            <input
              type="number"
              min={1}
              max={input.discountType === "percent" ? 100 : undefined}
              className={FIELD}
              value={input.discountValue}
              onChange={(e) => set("discountValue", Math.max(0, Number(e.target.value) || 0))}
              required
            />
            {input.discountType === "fixed" ? (
              <select
                className={FIELD}
                value={input.currency ?? "USD"}
                onChange={(e) => set("currency", e.target.value as "KRW" | "USD")}
              >
                <option value="USD">USD</option>
                <option value="KRW">KRW</option>
              </select>
            ) : null}
          </div>
          {input.discountType === "fixed" ? (
            <span className="block text-xs text-muted-foreground">
              통화가 다른 수업에는 적용되지 않습니다.
            </span>
          ) : null}
        </label>

        <label className="block space-y-1">
          <span className="text-sm font-medium">시작</span>
          <input
            type="datetime-local"
            className={FIELD}
            value={input.startsAt ?? ""}
            onChange={(e) => set("startsAt", e.target.value || null)}
          />
        </label>

        <label className="block space-y-1">
          <span className="text-sm font-medium">종료</span>
          <input
            type="datetime-local"
            className={FIELD}
            value={input.endsAt ?? ""}
            onChange={(e) => set("endsAt", e.target.value || null)}
          />
        </label>

        {optionalNumber("전체 사용 한도", "maxRedemptions", "비우면 무제한")}
        {optionalNumber("1인 사용 한도", "maxPerUser", "이메일 기준으로 셉니다")}
      </div>

      <label className="block space-y-1">
        <span className="text-sm font-medium">메모</span>
        <input
          className={FIELD}
          value={input.note ?? ""}
          onChange={(e) => set("note", e.target.value || null)}
          placeholder="어디에 쓰는 쿠폰인지"
        />
      </label>

      <label className="flex items-center gap-2">
        <input
          type="checkbox"
          checked={input.isActive}
          onChange={(e) => set("isActive", e.target.checked)}
          className="size-4"
        />
        <span className="text-sm">활성</span>
      </label>

      {error ? <p className="text-sm text-destructive">{error}</p> : null}

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={pending}
          className="h-11 rounded-lg bg-primary px-5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-60 sm:h-9"
        >
          {pending ? "저장 중…" : coupon ? "저장" : "만들기"}
        </button>
        <button
          type="button"
          onClick={() => router.push("/a/coupons")}
          className="h-11 rounded-lg border border-border px-5 text-sm text-foreground transition-colors hover:bg-muted sm:h-9"
        >
          취소
        </button>
      </div>
    </form>
  )
}
