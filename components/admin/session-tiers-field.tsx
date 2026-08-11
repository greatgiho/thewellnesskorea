"use client"

import { Plus, X } from "lucide-react"
import { applyDiscount, discountFrom, formatMoney, money } from "@/lib/payments/money"
import type { Currency, SeatTierInput } from "@/lib/schedule/types"

/**
 * Seat tiers on the session form.
 *
 * Deliberately a list of rows and not a grid of prices. The grade is the thing
 * that has seats — R sells out on its own — so it is the row, and its two
 * rates are two fields on it. A price grid would also have to invent a cell for
 * every grade-and-rate pair, including the ones a class does not sell.
 *
 * Leaving the list empty is the normal case and means the class is sold at one
 * price, exactly as before tiers existed.
 */
export function SessionTiersField({
  tiers,
  currency,
  discountType,
  discountValue,
  fieldClass,
  onChange,
}: {
  tiers: SeatTierInput[]
  currency: Currency
  discountType: "fixed" | "percent" | null
  discountValue: number | null
  fieldClass: string
  onChange: (next: SeatTierInput[]) => void
}) {
  const discount = discountFrom(discountType, discountValue)
  const step = currency === "KRW" ? 1000 : 1

  const set = (index: number, patch: Partial<SeatTierInput>) =>
    onChange(tiers.map((t, i) => (i === index ? { ...t, ...patch } : t)))

  const add = () =>
    onChange([
      ...tiers,
      {
        code: "",
        name: "",
        capacity: 10,
        price_amount: 0,
        child_price_amount: null,
      },
    ])

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">Seat tiers</span>
        <button
          type="button"
          onClick={add}
          className="inline-flex items-center gap-1 rounded-full border border-border px-3 py-1 text-xs text-foreground transition-colors hover:bg-secondary"
        >
          <Plus className="size-3" />
          등급 추가
        </button>
      </div>

      {tiers.length === 0 ? (
        <p className="text-xs text-muted-foreground">
          비워두면 위의 단일 가격으로 판매합니다.
        </p>
      ) : (
        <>
          <div className="space-y-2">
            {tiers.map((tier, index) => {
              const preview = applyDiscount(
                money(currency, tier.price_amount),
                discount,
              )
              return (
                <div
                  key={tier.id ?? `new-${index}`}
                  className="rounded-xl border border-border p-3"
                >
                  <div className="flex gap-2">
                    <input
                      type="text"
                      className={fieldClass}
                      style={{ width: "5rem" }}
                      placeholder="R"
                      value={tier.code}
                      onChange={(e) => set(index, { code: e.target.value })}
                    />
                    <input
                      type="text"
                      className={fieldClass}
                      placeholder="설명 (선택) — 앞 3열"
                      value={tier.name}
                      onChange={(e) => set(index, { name: e.target.value })}
                    />
                    <button
                      type="button"
                      onClick={() => onChange(tiers.filter((_, i) => i !== index))}
                      aria-label="등급 삭제"
                      className="flex size-9 shrink-0 items-center justify-center rounded-lg border border-border text-muted-foreground transition-colors hover:bg-secondary"
                    >
                      <X className="size-4" />
                    </button>
                  </div>

                  <div className="mt-2 grid grid-cols-3 gap-2">
                    <label className="block space-y-1">
                      <span className="text-xs text-muted-foreground">정원</span>
                      <input
                        type="number"
                        min={1}
                        className={fieldClass}
                        value={tier.capacity}
                        onChange={(e) =>
                          set(index, {
                            capacity: Math.max(1, Number(e.target.value) || 1),
                          })
                        }
                      />
                    </label>
                    <label className="block space-y-1">
                      <span className="text-xs text-muted-foreground">
                        가격 ({currency})
                      </span>
                      <input
                        type="number"
                        min={0}
                        step={step}
                        className={fieldClass}
                        value={tier.price_amount}
                        onChange={(e) =>
                          set(index, {
                            price_amount: Math.max(0, Number(e.target.value) || 0),
                          })
                        }
                      />
                    </label>
                    <label className="block space-y-1">
                      <span className="text-xs text-muted-foreground">아동</span>
                      <input
                        type="number"
                        min={0}
                        step={step}
                        className={fieldClass}
                        placeholder="없음"
                        value={tier.child_price_amount ?? ""}
                        onChange={(e) =>
                          // Blank and 0 differ here too: blank hides the child
                          // option for this tier, 0 lets children in free.
                          set(index, {
                            child_price_amount:
                              e.target.value === ""
                                ? null
                                : Math.max(0, Number(e.target.value) || 0),
                          })
                        }
                      />
                    </label>
                  </div>

                  {discount ? (
                    <p className="mt-2 text-xs text-muted-foreground">
                      고객 화면: {formatMoney(preview.final)}
                    </p>
                  ) : null}
                </div>
              )
            })}
          </div>
          <p className="text-xs text-muted-foreground">
            등급을 쓰면 수업 정원은 등급 정원의 합이 됩니다. 예약이 있는 등급은
            지울 수 없습니다.
          </p>
        </>
      )}
    </div>
  )
}
