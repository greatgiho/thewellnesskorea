import { formatMoney, isDiscounted, type PricedMoney } from "@/lib/payments/money"
import { cn } from "@/lib/utils"

/**
 * A price, struck through and replaced when discounted:
 *
 *   ~~$50.00~~  $25.00 (50% off)
 *
 * Undiscounted prices render as a plain amount, so callers can use this
 * everywhere a price appears without branching.
 */
export function PriceTag({
  priced,
  className,
  showPercent = true,
}: {
  priced: PricedMoney
  className?: string
  showPercent?: boolean
}) {
  if (!isDiscounted(priced)) {
    return (
      <span className={cn("text-foreground", className)}>
        {formatMoney(priced.original)}
      </span>
    )
  }

  const free = priced.final.amount === 0

  return (
    <span className={cn("inline-flex flex-wrap items-baseline gap-x-2", className)}>
      <s className="text-muted-foreground" aria-label="정가">
        {formatMoney(priced.original)}
      </s>
      <span className="font-medium text-foreground">
        {free ? "무료" : formatMoney(priced.final)}
      </span>
      {showPercent && priced.percentOff > 0 ? (
        <span className="text-sm font-medium text-primary">
          ({priced.percentOff}% off)
        </span>
      ) : null}
    </span>
  )
}
