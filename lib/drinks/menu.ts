import type { Money } from "@/lib/payments/money"

/**
 * What is on sale at the counter.
 *
 * A drink is not a class: nothing is reserved, no seat is held, nobody is
 * emailed. It is rung up under a name, paid for from a QR, and handed over.
 * So this deliberately does not go near sessions or the payments table — a
 * counter sale is drink_orders (065) and one PayPal order.
 *
 * The menu lives in code rather than the database because it is one price that
 * changes about as often as a deploy does, and a table would drag an admin
 * screen, a migration on three databases and an RLS policy behind it. Adding a
 * second drink is one more object below; when there are enough of them that
 * editing this file is the wrong way to change a price, that is the signal to
 * move it, and the shape here is already the shape a row would have.
 *
 * Nothing reads this after a sale is rung up. drink_orders copies the name and
 * the price onto the row, so changing a price here cannot rewrite what someone
 * was charged last week.
 *
 * Priced in USD because PayPal cannot charge won. That is not a preference —
 * Toss is suspended until the merchant re-review passes (see TOSS_SUSPENDED in
 * lib/payments/money.ts), and until then dollars are the only online option.
 */

export type Drink = {
  /** Recorded on the order as item_id, so a sale can name what it was for. */
  id: string
  name: string
  price: Money
}

/**
 * $5.00 nets about ₩6,140 after PayPal's 4.4% + $0.30 and the 3% conversion
 * spread on withdrawal. The fixed $0.30 is what makes a single drink expensive
 * to process — it alone is 6% of this — so the margin here is thinner than the
 * headline rate suggests.
 */
export const DRINKS: Drink[] = [
  { id: "drink", name: "Drink", price: { currency: "USD", amount: 5 } },
]

/** What the counter rings up when nothing else is chosen. */
export const DEFAULT_DRINK_ID = "drink"

/**
 * The item being sold, or null.
 *
 * Every price is read through here on the server, at the moment a sale is rung
 * up. The browser only ever sends an id, so there is no amount for anyone to
 * change on the way past.
 */
export function findDrink(id: string): Drink | null {
  return DRINKS.find((drink) => drink.id === id) ?? null
}

/**
 * The short code on the receipt, from the PayPal capture id.
 *
 * The tail rather than the head: PayPal capture ids share a leading run, so
 * the first characters of two sales look alike and the last do not. Uppercase
 * because it gets read aloud across a counter.
 */
export function receiptCode(captureId: string): string {
  return captureId.slice(-8).toUpperCase()
}
