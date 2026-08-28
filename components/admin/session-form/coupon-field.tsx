"use client"

import { useEffect, useState } from "react"
import { CopyLinkButton } from "@/components/referrals/copy-link-button"
import {
  getApplicableCoupons,
  type ApplicableCoupon,
} from "@/app/a/schedule/coupon-actions"
import { couponLink, normalizeCouponCode } from "@/lib/coupons/link"
import type { SessionFieldsProps } from "@/components/admin/session-form/fields"
import { formatMoney, money } from "@/lib/payments/money"

/**
 * The one discount code that belongs to this class.
 *
 * It sits in the pricing panel because that is where the question comes up.
 * Codes have always lived at /a/coupons, which is the right home for a code
 * good across an experience or one with a date window — but getting a code for
 * the class in front of you meant leaving the class, and so nobody did.
 *
 * Since 070 the code composes with the discount above rather than competing
 * with it, so the two fields on this panel mean different things and both
 * apply: the discount is the price everyone pays, the code is what one person
 * was handed. The preview says so out loud, because "30% and 50%" is exactly
 * the pair somebody expects to add up to 80.
 *
 * The link only appears for a class that exists. A new one has no id yet, so
 * there is nowhere to send anybody until it is saved.
 */
export function SessionCouponField({
  input,
  setInput,
  fieldClass,
  sessionId,
  experienceId,
}: SessionFieldsProps & {
  sessionId: string | null
  experienceId: string | null
}) {
  const coupon = input.coupon
  const currency = input.price_currency

  // Codes that already work here without being this class's own. Loaded rather
  // than passed down: they are reference material, not something the form
  // edits, and threading them through the input would invite someone to save
  // them by accident.
  const [others, setOthers] = useState<ApplicableCoupon[]>([])
  useEffect(() => {
    let live = true
    getApplicableCoupons(experienceId).then((rows) => {
      if (live) setOthers(rows)
    })
    return () => {
      live = false
    }
  }, [experienceId])

  const set = (patch: Partial<NonNullable<typeof coupon>>) =>
    setInput((v) => ({
      ...v,
      coupon: {
        code: "",
        discount_type: "percent",
        discount_value: 0,
        ...v.coupon,
        ...patch,
      },
    }))

  // What the holder of this code actually pays, both discounts applied in the
  // order the database applies them.
  const afterSession =
    input.discount_type === "percent"
      ? input.price_amount * (1 - (input.discount_value ?? 0) / 100)
      : input.discount_type === "fixed"
        ? Math.max(0, input.price_amount - (input.discount_value ?? 0))
        : input.price_amount
  const afterCoupon = !coupon?.discount_value
    ? afterSession
    : coupon.discount_type === "percent"
      ? afterSession * (1 - coupon.discount_value / 100)
      : Math.max(0, afterSession - coupon.discount_value)

  return (
    <div className="space-y-3">
      <div>
        <span className="text-sm font-medium">이 수업 전용 할인코드</span>
        <p className="mt-0.5 text-xs text-muted-foreground">
          위의 할인과 <strong className="font-medium">함께</strong> 적용됩니다.
          수업 할인이 가격을 정하고, 코드는 거기서 한 번 더 빠집니다. 기간이나
          사용 횟수 제한이 필요하면 쿠폰 화면에서 만드세요.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        <input
          type="text"
          className={`${fieldClass} w-40 uppercase`}
          placeholder="코드 없음"
          value={coupon?.code ?? ""}
          onChange={(e) => {
            const code = e.target.value
            // Clearing the box removes the code, which is the only way to take
            // one back — there is no delete button to go looking for.
            if (!code.trim()) {
              setInput((v) => ({ ...v, coupon: null }))
              return
            }
            set({ code: normalizeCouponCode(code) })
          }}
        />
        <select
          className={`${fieldClass} w-28`}
          value={coupon?.discount_type ?? "percent"}
          disabled={!coupon}
          onChange={(e) =>
            set({ discount_type: e.target.value as "fixed" | "percent" })
          }
        >
          <option value="percent">정률 %</option>
          <option value="fixed">정액</option>
        </select>
        <input
          type="number"
          min={0}
          max={coupon?.discount_type === "percent" ? 100 : undefined}
          step={coupon?.discount_type === "percent" ? 1 : 100}
          className={`${fieldClass} w-28`}
          placeholder="0"
          disabled={!coupon}
          value={coupon?.discount_value ?? ""}
          onChange={(e) => set({ discount_value: Number(e.target.value) })}
        />
      </div>

      {coupon?.code && coupon.discount_value > 0 ? (
        <p className="text-xs text-muted-foreground">
          이 코드를 쓰면{" "}
          <span className="font-medium text-foreground">
            {formatMoney(money(currency, afterCoupon))}
          </span>
          {afterSession !== input.price_amount ? (
            <> (수업 할인 적용가 {formatMoney(money(currency, afterSession))}에서 추가 할인)</>
          ) : null}
        </p>
      ) : null}

      {others.length > 0 ? (
        <div className="rounded-xl border border-border bg-secondary/30 p-3">
          <p className="text-xs font-medium text-foreground">
            이 수업에 이미 적용되는 코드
          </p>
          <ul className="mt-2 space-y-1">
            {others.map((c) => (
              <li key={c.id} className="text-xs text-muted-foreground">
                <span className="font-mono text-foreground">{c.code}</span>{" "}
                {c.discountType === "percent"
                  ? `${c.discountValue}%`
                  : formatMoney(money(c.currency ?? currency, c.discountValue))}{" "}
                · {c.scope === "all" ? "모든 수업" : "이 체험 전체"}
                {c.isActive ? "" : " · 사용 중지됨"}
                {/* A fixed coupon can only be spent in the currency it names,
                    so on a class priced in the other one it is listed and
                    refused. Saying so here beats finding out at checkout. */}
                {c.discountType === "fixed" && c.currency && c.currency !== currency
                  ? " · 통화가 달라 이 수업엔 적용 안 됨"
                  : ""}
                {c.endsAt ? ` · ${new Date(c.endsAt).toLocaleString("ko-KR", {
                  month: "2-digit",
                  day: "2-digit",
                  hour: "2-digit",
                  minute: "2-digit",
                })}까지` : ""}
              </li>
            ))}
          </ul>
          <p className="mt-2 text-xs text-muted-foreground">
            여기서 고칠 수 없습니다 — 쿠폰 화면에서 관리합니다. 위 칸은 이
            수업에서만 쓰는 코드를 따로 만들 때 씁니다.
          </p>
        </div>
      ) : null}

      {sessionId && coupon?.code ? (
        <div className="flex flex-wrap items-center gap-3">
          <span className="break-all font-mono text-xs text-muted-foreground">
            {couponLink(sessionId, coupon.code)}
          </span>
          <CopyLinkButton link={couponLink(sessionId, coupon.code)} />
        </div>
      ) : null}
    </div>
  )
}
