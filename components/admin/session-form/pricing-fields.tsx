"use client"

import type { SessionWithRelations } from "@/lib/schedule/types"
import { PriceTag } from "@/components/booking/price-tag"
import type { SessionFieldsProps } from "@/components/admin/session-form/fields"

type Priced = React.ComponentProps<typeof PriceTag>["priced"]

/**
 * Seats and money: capacity, price, how it is paid, the child rate, discounts.
 *
 * These move as a set. Currency changes the step on three inputs and the label
 * on the discount; a discount changes what the customer sees for both the
 * adult and the child rate; tiers take capacity over entirely. Splitting them
 * further would mean passing currency and discount back and forth between
 * siblings to say the same things.
 *
 * The stealth toggle sits in the middle of this because that is where it has
 * always been on screen. It is a visibility setting, not a pricing one, and it
 * would read better beside the publish controls — left alone here so this
 * change is only a move, not a redesign.
 */
export function PricingFields({
  input,
  setInput,
  fieldClass,
  session,
  effectiveCapacity,
  discountPreview,
  childPreview,
}: SessionFieldsProps & {
  session?: SessionWithRelations | null
  effectiveCapacity: number
  discountPreview: Priced | null
  childPreview: Priced | null
}) {
  return (
    <>
      <label className="block space-y-1.5">
        <span className="text-sm font-medium">Capacity</span>
        <input
          type="number"
          min={1}
          className={fieldClass}
          // Derived once the class has grades: entering it twice is one
          // more thing that can disagree with itself.
          readOnly={input.tiers.length > 0}
          value={effectiveCapacity}
          onChange={(e) =>
            setInput((v) => ({ ...v, capacity: Number(e.target.value) }))
          }
        />
        {input.tiers.length > 0 ? (
          <p className="text-xs text-muted-foreground">등급 정원의 합</p>
        ) : null}
        {session ? (
          <p className="text-xs text-muted-foreground">
            {session.booked_count} / {session.capacity} spots currently booked
          </p>
        ) : null}
      </label>

      <label className="block space-y-1.5">
        <span className="text-sm font-medium">Price</span>
        <div className="flex gap-2">
          <select
            className={fieldClass}
            style={{ width: "6rem" }}
            value={input.price_currency}
            onChange={(e) =>
              setInput((v) => ({
                ...v,
                price_currency: e.target.value as "USD" | "KRW",
              }))
            }
          >
            <option value="USD">USD</option>
            <option value="KRW">KRW</option>
          </select>
          <input
            type="number"
            min={0}
            step={input.price_currency === "KRW" ? 1000 : 1}
            className={fieldClass}
            value={input.price_amount}
            onChange={(e) =>
              setInput((v) => ({
                ...v,
                price_amount: Math.max(0, Number(e.target.value) || 0),
              }))
            }
          />
        </div>
        <p className="text-xs text-muted-foreground">
          0 = 무료. 그 이상이면 아래 결제 방식을 따릅니다.
        </p>
      </label>

      <label className="block space-y-1.5">
        <span className="text-sm font-medium">결제 방식</span>
        <select
          className={fieldClass}
          value={input.payment_method}
          onChange={(e) =>
            setInput((v) => ({
              ...v,
              payment_method: e.target.value as "online" | "onsite",
            }))
          }
        >
          <option value="online">온라인 결제 (예약 시 선결제)</option>
          <option value="onsite">현장 결제 (예약만 하고 와서 결제)</option>
        </select>
        <p className="text-xs text-muted-foreground">
          {input.payment_method === "onsite"
            ? "결제창을 띄우지 않습니다. 해외 카드 손님이 오는 수업에 쓰세요 — 국내일반결제로는 해외 발급 카드가 승인되지 않습니다."
            : input.price_currency === "USD"
              ? "PayPal 로 결제합니다."
              : "토스로 결제합니다. 해외 발급 카드는 승인되지 않습니다."}
        </p>
      </label>

      <label className="flex items-start gap-3">
        <input
          type="checkbox"
          className="mt-0.5"
          checked={!input.is_listed}
          onChange={(e) =>
            setInput((v) => ({ ...v, is_listed: !e.target.checked }))
          }
        />
        <span className="space-y-1">
          <span className="block text-sm font-medium">목록에 숨기기 (스텔스)</span>
          <span className="block text-xs text-muted-foreground">
            홈·강사 페이지·일정에 나오지 않고, 링크를 아는 사람만 예약할 수
            있습니다. 비공개 수업이나 결제 테스트에 쓰세요.
          </span>
        </span>
      </label>

      <label className="block space-y-1.5">
        <span className="text-sm font-medium">Child price</span>
        <input
          type="number"
          min={0}
          step={input.price_currency === "KRW" ? 1000 : 1}
          className={fieldClass}
          placeholder="없음 — 아동 요금 미적용"
          value={input.child_price_amount ?? ""}
          onChange={(e) =>
            setInput((v) => ({
              ...v,
              // Empty is not zero: blank means the class has no child
              // rate and the booking form shows no child option, while 0
              // means children attend free.
              child_price_amount:
                e.target.value === ""
                  ? null
                  : Math.max(0, Number(e.target.value) || 0),
            }))
          }
        />
      </label>

      <label className="block space-y-1">
        <span className="text-sm font-medium">Discount</span>
        <div className="flex gap-2">
          <select
            className={fieldClass}
            value={input.discount_type ?? ""}
            onChange={(e) => {
              const type = e.target.value as "" | "fixed" | "percent"
              setInput((v) => ({
                ...v,
                // Both columns travel together — the DB rejects one
                // without the other.
                discount_type: type === "" ? null : type,
                discount_value: type === "" ? null : (v.discount_value ?? 0),
              }))
            }}
          >
            <option value="">없음</option>
            <option value="percent">정률 (%)</option>
            <option value="fixed">정액 ({input.price_currency})</option>
          </select>
          <input
            type="number"
            min={0}
            max={input.discount_type === "percent" ? 100 : input.price_amount}
            step={
              input.discount_type === "percent"
                ? 1
                : input.price_currency === "KRW"
                  ? 1000
                  : 1
            }
            disabled={input.discount_type === null}
            className={fieldClass}
            value={input.discount_value ?? ""}
            onChange={(e) =>
              setInput((v) => ({
                ...v,
                discount_value: Math.max(0, Number(e.target.value) || 0),
              }))
            }
          />
        </div>
        {discountPreview ? (
          <p className="text-xs text-muted-foreground">
            고객 화면: <PriceTag priced={discountPreview} />
          </p>
        ) : (
          <p className="text-xs text-muted-foreground">
            정률은 1–100%, 정액은 정가 이하. 100% 할인은 무료 수업이 됩니다.
          </p>
        )}
        {childPreview ? (
          <p className="text-xs text-muted-foreground">
            아동: <PriceTag priced={childPreview} />
          </p>
        ) : null}
      </label>
    </>
  )
}
