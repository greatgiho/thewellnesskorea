"use client"

import { formatMoney, tierSeatsLeft, type OrderQuote } from "@/lib/payments/money"
import { tierLabel } from "@/lib/schedule/tiers"
import { Stepper } from "./stepper"

/**
 * Choosing what to buy: how many of which seat tier.
 *
 * One block per rate card, which for a class without tiers is exactly one
 * unlabelled block — so this is the same component whether the class is sold
 * at one price or by grade, and there is no second layout to keep in step.
 *
 * The bounds are the interesting part. Seats are per grade, so R selling out
 * must not take S with it; on top of that the whole order is capped, both by
 * what is left in the class and by the per-booking limit. Both are re-checked
 * inside the booking transaction — a stepper that stops is a courtesy, not the
 * enforcement.
 */
export function OrderPicker({
  quote,
  onChange,
  maxSize,
  disabled,
}: {
  quote: OrderQuote
  onChange: (tierId: string | null, next: { adults: number; children: number }) => void
  /** Seats left in the class, already capped at the per-booking limit. */
  maxSize: number
  disabled?: boolean
}) {
  const roomInOrder = Math.max(0, maxSize - quote.size)
  const tiered = quote.lines.length > 1 || Boolean(quote.lines[0]?.rate.id)

  return (
    <div className="mt-4 space-y-3">
      {/* The order travels as one field: the number of lines is the number of
          tiers, and neither side should learn that by counting inputs. */}
      <input
        type="hidden"
        name="orderLines"
        value={JSON.stringify(
          quote.lines
            .filter((l) => l.quote.size > 0)
            .map((l) => ({
              tierId: l.rate.id,
              adults: l.quote.party.adults,
              children: l.quote.party.children,
            })),
        )}
      />

      {quote.lines.map((line) => {
        const { rate, quote: party } = line
        // Room in this grade, plus whatever this line already holds.
        const room = Math.min(
          roomInOrder,
          Math.max(0, tierSeatsLeft(rate) - party.size),
        )
        const soldOut = tierSeatsLeft(rate) === 0
        const label = tierLabel(rate)

        return (
          <div
            key={rate.id ?? "single"}
            className="rounded-xl border border-border px-4 py-2"
          >
            {tiered ? (
              <div className="flex items-baseline justify-between gap-3 border-b border-border/60 pb-2 pt-1">
                <p className="text-sm font-medium text-foreground">{label}</p>
                <p className="text-xs text-muted-foreground">
                  {soldOut ? "매진" : `${tierSeatsLeft(rate)} left`}
                </p>
              </div>
            ) : null}

            <Stepper
              label="Adults"
              price={formatMoney(party.adult.final)}
              value={party.party.adults}
              onChange={(adults) =>
                onChange(rate.id, { ...party.party, adults })
              }
              min={0}
              max={party.party.adults + room}
              disabled={disabled || soldOut}
            />

            {party.child ? (
              <div className="border-t border-border/60">
                <Stepper
                  label="Children"
                  price={formatMoney(party.child.final)}
                  value={party.party.children}
                  onChange={(children) =>
                    onChange(rate.id, { ...party.party, children })
                  }
                  min={0}
                  max={party.party.children + room}
                  disabled={disabled || soldOut}
                />
              </div>
            ) : null}
          </div>
        )
      })}
    </div>
  )
}
