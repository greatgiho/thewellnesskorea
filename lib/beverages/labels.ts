import { formatClockInKst } from "@/lib/time/kst"
import { receiptCode } from "@/lib/beverages/menu"

/**
 * What to call an order on screen.
 *
 * Three answers, in order of how much they can be trusted:
 *
 *   1. the nickname, if a barista typed one — it is what the customer asked to
 *      be called, so it beats anything we worked out ourselves
 *   2. the name on the PayPal account that paid — nobody typed it, and it is
 *      the usual case now that a nickname is optional
 *   3. the receipt code — a guest paying by card has no account and may have
 *      given no name, and eight characters is still something to call out
 *
 * Then the clock, but only where two of those come out the same. Prefixing
 * everything would put a timestamp in front of a problem most rows do not have
 * and turn a queue into a log.
 */

export type LabelledOrder = {
  id: string
  nickname: string | null
  payer: { name?: string }
  paypalCaptureId: string | null
  createdAt: string
}

/** What the customer is called, or null when nothing named them. */
export function beverageOrderName(order: {
  nickname: string | null
  payer: { name?: string }
}): string | null {
  return order.nickname?.trim() || order.payer.name?.trim() || null
}

/** The same, with the receipt code standing in when nothing named them. */
function displayName(order: LabelledOrder): string {
  return (
    beverageOrderName(order) ??
    (order.paypalCaptureId ? receiptCode(order.paypalCaptureId) : "—")
  )
}

function key(name: string): string {
  return name.trim().toLowerCase()
}

/**
 * Display names by order id, for one set of orders shown together.
 *
 * Scoped to what is on screen on purpose: a name is only ambiguous next to the
 * other name it clashes with. Someone called 태연 last Tuesday does not make
 * today's 태연 need a clock.
 *
 * Compared case-insensitively and trimmed, because "Mia" and "mia " is one
 * name written twice, and a collision missed is worse than one flagged too
 * eagerly.
 */
export function beverageOrderLabels(
  orders: LabelledOrder[],
): Record<string, string> {
  const names = new Map<string, string>()
  const counts = new Map<string, number>()

  for (const order of orders) {
    const name = displayName(order)
    names.set(order.id, name)
    counts.set(key(name), (counts.get(key(name)) ?? 0) + 1)
  }

  const labels: Record<string, string> = {}
  for (const order of orders) {
    const name = names.get(order.id) as string
    labels[order.id] =
      (counts.get(key(name)) ?? 0) > 1
        ? `${formatClockInKst(order.createdAt)} ${name}`
        : name
  }
  return labels
}
