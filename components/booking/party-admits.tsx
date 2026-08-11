import { formatParty } from "@/lib/bookings/format"
import { cn } from "@/lib/utils"

/**
 * How many people one ticket lets in.
 *
 * A booking used to be one person, so a QR meant "admit the holder". It can
 * now be a family, and the only place that fact exists is next to the code —
 * whoever is scanning has to know they are admitting three people before they
 * wave the first one through. So the headcount is the loud part and the
 * makeup is the caption, and a party of one deliberately stays quiet: making
 * every ticket shout a number is how the number stops being read.
 */
export function PartyAdmits({
  adults,
  children,
  className,
}: {
  adults: number
  children: number
  className?: string
}) {
  const size = adults + children
  const makeup = formatParty(adults, children)

  if (size <= 1) {
    return <span className={cn("text-base text-foreground", className)}>{makeup}</span>
  }

  return (
    <span className={cn("flex flex-wrap items-baseline gap-x-3", className)}>
      <span className="font-serif text-3xl leading-none text-foreground">
        {size}
      </span>
      <span className="text-sm text-muted-foreground">{makeup}</span>
    </span>
  )
}
