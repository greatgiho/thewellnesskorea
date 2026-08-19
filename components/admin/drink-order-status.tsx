import type { DrinkOrderStatus } from "@/lib/drinks/orders"

/**
 * What state a counter sale is in, in one word.
 *
 * Colour carries the meaning at a glance across a counter: green is the drink
 * to start making, amber is the one still waiting on a phone, grey is done
 * with. The word is there because colour alone is not a label.
 */
const STYLES: Record<DrinkOrderStatus, { label: string; className: string }> = {
  pending: {
    label: "대기",
    className: "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-400",
  },
  paid: {
    label: "결제됨",
    className:
      "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
  },
  refunded: {
    label: "환불됨",
    className: "border-border bg-muted text-muted-foreground",
  },
}

export function DrinkOrderStatusBadge({ status }: { status: DrinkOrderStatus }) {
  const { label, className } = STYLES[status]
  return (
    <span
      className={`inline-flex shrink-0 rounded-full border px-2.5 py-0.5 text-[11px] ${className}`}
    >
      {label}
    </span>
  )
}
