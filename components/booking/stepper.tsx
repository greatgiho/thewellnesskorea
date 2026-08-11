"use client"

import { Minus, Plus } from "lucide-react"

/**
 * One count, with its bounds made visible.
 *
 * A stepper rather than a free number field because the limits are the point:
 * seats left in a grade, and the per-booking cap. A control that stops says
 * that more plainly than an error after the fact.
 */
export function Stepper({
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
