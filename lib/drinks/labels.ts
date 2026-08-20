import { formatClockInKst } from "@/lib/time/kst"

/**
 * What to call each order on screen.
 *
 * The nickname, normally — it is what the customer gave and what gets called
 * out. But nothing stops two people picking the same one, and two rows both
 * reading 태연 is how the wrong drink gets handed over and the wrong sale gets
 * refunded.
 *
 * So the time is added only where it is needed. Prefixing everything would put
 * a clock in front of every row to solve a problem most of them do not have,
 * and the counter would read as a log rather than a queue.
 *
 * Compared case-insensitively and trimmed, because "태연" and "태연 " are the
 * same person, and a collision missed is worse than one flagged too eagerly.
 */

export type LabelledOrder = {
  id: string
  nickname: string
  createdAt: string
}

function key(nickname: string): string {
  return nickname.trim().toLowerCase()
}

/**
 * Display names by order id, for one set of orders shown together.
 *
 * Scoped to what is on screen on purpose: a name is only ambiguous next to the
 * other name it clashes with. Someone called 태연 last Tuesday does not make
 * today's 태연 need a clock.
 */
export function drinkOrderLabels(
  orders: LabelledOrder[],
): Record<string, string> {
  const counts = new Map<string, number>()
  for (const order of orders) {
    const k = key(order.nickname)
    counts.set(k, (counts.get(k) ?? 0) + 1)
  }

  const labels: Record<string, string> = {}
  for (const order of orders) {
    const clashes = (counts.get(key(order.nickname)) ?? 0) > 1
    labels[order.id] = clashes
      ? `${formatClockInKst(order.createdAt)} ${order.nickname}`
      : order.nickname
  }
  return labels
}
