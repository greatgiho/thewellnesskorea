"use client"

import { Minus, Plus } from "lucide-react"
import { formatMoney, type Party, type PartyQuote } from "@/lib/payments/money"

/**
 * How many people this booking is for.
 *
 * Steppers rather than a free number field: the bounds are the point. The
 * total cannot exceed the seats left or the per-booking cap, and a stepper
 * that stops is a clearer statement of that than a validation message after
 * the fact. The values still travel as plain inputs, and the server re-checks
 * them — this is the pleasant path, not the enforcement.
 */
function Stepper({
  label,
  price,
  value,
  onChange,
  min,
  max,
  disabled,
}: {
  label: string
  price: string
  value: number
  onChange: (next: number) => void
  min: number
  max: number
  disabled?: boolean
}) {
  const step = (delta: number) => () =>
    onChange(Math.min(max, Math.max(min, value + delta)))

  return (
    <div className="flex items-center justify-between gap-4 py-2">
      <div>
        <p className="text-sm font-medium text-foreground">{label}</p>
        <p className="text-sm text-muted-foreground">{price}</p>
      </div>
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={step(-1)}
          disabled={disabled || value <= min}
          aria-label={`${label} 한 명 줄이기`}
          className="flex size-9 items-center justify-center rounded-full border border-border text-foreground transition-colors hover:bg-secondary disabled:opacity-30"
        >
          <Minus className="size-4" />
        </button>
        <span
          aria-live="polite"
          className="w-8 text-center text-base tabular-nums text-foreground"
        >
          {value}
        </span>
        <button
          type="button"
          onClick={step(1)}
          disabled={disabled || value >= max}
          aria-label={`${label} 한 명 늘리기`}
          className="flex size-9 items-center justify-center rounded-full border border-border text-foreground transition-colors hover:bg-secondary disabled:opacity-30"
        >
          <Plus className="size-4" />
        </button>
      </div>
    </div>
  )
}

export function PartyPicker({
  quote,
  party,
  onChange,
  maxSize,
  disabled,
}: {
  quote: PartyQuote
  party: Party
  onChange: (next: Party) => void
  /** Seats left, already capped at the per-booking limit. */
  maxSize: number
  disabled?: boolean
}) {
  const size = party.adults + party.children
  const room = Math.max(0, maxSize - size)

  return (
    <div className="mt-4 rounded-xl border border-border px-4 py-2">
      {/* The counts travel as plain fields; the steppers only set them. */}
      <input type="hidden" name="adultCount" value={party.adults} />
      <input type="hidden" name="childCount" value={party.children} />

      <Stepper
        label="Adults"
        price={formatMoney(quote.adult.final)}
        value={party.adults}
        onChange={(adults) => onChange({ ...party, adults })}
        // Zero adults is only a booking if a child is on it.
        min={party.children > 0 ? 0 : 1}
        max={party.adults + room}
        disabled={disabled}
      />

      {quote.child ? (
        <div className="border-t border-border/60">
          <Stepper
            label="Children"
            price={formatMoney(quote.child.final)}
            value={party.children}
            onChange={(children) =>
              onChange({
                ...party,
                children,
                // Dropping to zero children with no adults would leave a
                // booking for nobody.
                adults: children === 0 ? Math.max(1, party.adults) : party.adults,
              })
            }
            min={party.adults > 0 ? 0 : 1}
            max={party.children + room}
            disabled={disabled}
          />
        </div>
      ) : null}
    </div>
  )
}
