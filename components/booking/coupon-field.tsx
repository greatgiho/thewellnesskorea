"use client"

import { useEffect, useRef, useState, useTransition } from "react"
import { previewCoupon, type CouponPreview } from "@/app/book/actions"
import type { OrderLine } from "@/lib/payments/money"
import { FIELD_PUBLIC } from "@/lib/ui/field"
import { cn } from "@/lib/utils"

/**
 * Coupon entry for the booking form.
 *
 * Checking a code is only a preview — the value submitted is the raw code, and
 * the booking transaction validates it again under a lock. So a code that
 * sells out between the check and the submit is refused where it matters, and
 * this never needs to be the source of truth for the price.
 */
export function CouponField({
  sessionId,
  email,
  lines,
  disabled,
  initialCode,
}: {
  sessionId: string
  email: string
  lines: OrderLine[]
  disabled?: boolean
  /** From `?coupon=CODE`. Filled in and checked once, on arrival. */
  initialCode?: string | null
}) {
  const [code, setCode] = useState(initialCode ?? "")
  const [result, setResult] = useState<CouponPreview | null>(null)
  const [pending, startTransition] = useTransition()

  // A verdict is priced against one order. Adding or removing anyone makes the
  // amount on screen wrong, so it is dropped rather than left to be read as
  // the new total.
  const signature = JSON.stringify(lines)
  useEffect(() => setResult(null), [signature])

  const check = (value = code) => {
    const trimmed = value.trim()
    if (!trimmed) {
      setResult(null)
      return
    }
    startTransition(async () => {
      setResult(await previewCoupon(sessionId, trimmed, email, lines))
    })
  }

  // Someone who followed a coupon link has already been told there is a
  // discount. Landing on a filled box with an unpressed 적용 button beside it
  // asks them to confirm their own invitation, and a wrong code should say so
  // here rather than at the end of the form.
  //
  // Once, on arrival. Not on every change to `lines`: the effect above clears
  // the verdict when the party changes, and re-checking there would fire a
  // request per tap of the passenger stepper.
  const autoChecked = useRef(false)
  // Whether the box is showing at all. Someone who followed a coupon link is
  // not entering a code — they were given one — so the field would be asking
  // them to check our work. It stays reachable behind "코드 변경" for the
  // person who has a different code than the link they were sent.
  const [editing, setEditing] = useState(!initialCode?.trim())
  useEffect(() => {
    if (autoChecked.current) return
    const seeded = initialCode?.trim()
    if (!seeded) return
    autoChecked.current = true
    check(seeded)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialCode])

  // Arrived by link and still being checked. Rendering the input here and
  // swapping it for the line below a moment later would flash a form control
  // at somebody who never has to touch one.
  if (!editing && !result) {
    return (
      <div className="mt-4 rounded-2xl border border-border bg-secondary/30 px-4 py-3">
        <input type="hidden" name="couponCode" value={code.trim()} />
        <p className="text-sm text-muted-foreground">
          쿠폰 <span className="font-mono">{code.trim()}</span> 확인 중…
        </p>
      </div>
    )
  }

  // Applied, arrived by link, and nobody has asked to change it: one line
  // saying so, rather than a form control for a decision already made.
  if (!editing && result?.ok) {
    return (
      <div className="mt-4 rounded-2xl border border-primary/30 bg-primary/5 px-4 py-3">
        <input type="hidden" name="couponCode" value={code.trim()} />
        <p className="text-sm text-primary">
          쿠폰 <span className="font-mono font-medium">{code.trim()}</span> 적용됨
          — {result.discount} 할인, 결제 금액 {result.total}
          {result.percentOff > 0 ? ` (${result.percentOff}% off)` : ""}
        </p>
        <button
          type="button"
          onClick={() => setEditing(true)}
          className="mt-1 text-xs text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
        >
          코드 변경
        </button>
      </div>
    )
  }

  return (
    <div className="mt-4">
      {/* The code travels with the form; the preview above is advisory. */}
      <input type="hidden" name="couponCode" value={code.trim()} />

      <label className="block space-y-1.5">
        <span className="text-sm font-medium">
          쿠폰 코드{" "}
          <span className="font-normal text-muted-foreground">(선택)</span>
        </span>
        <div className="flex gap-2">
          <input
            type="text"
            inputMode="text"
            autoCapitalize="characters"
            autoComplete="off"
            disabled={disabled}
            className={cn(FIELD_PUBLIC, "uppercase")}
            placeholder="코드를 입력하세요"
            value={code}
            onChange={(e) => {
              setCode(e.target.value)
              // A stale verdict next to an edited code is worse than none.
              setResult(null)
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault()
                check()
              }
            }}
          />
          <button
            type="button"
            onClick={() => check()}
            disabled={disabled || pending || !code.trim()}
            className="h-11 shrink-0 rounded-full border border-border px-5 text-sm font-medium text-foreground transition-colors hover:bg-secondary disabled:opacity-50"
          >
            {pending ? "확인 중…" : "적용"}
          </button>
        </div>
      </label>

      {result ? (
        result.ok ? (
          <p className="mt-2 text-sm text-primary">
            쿠폰 적용 — {result.discount} 할인, 결제 금액 {result.total}
            {result.percentOff > 0 ? ` (${result.percentOff}% off)` : ""}
          </p>
        ) : (
          <p className="mt-2 text-sm text-destructive">{result.message}</p>
        )
      ) : null}
    </div>
  )
}
