import type { Money } from "@/lib/payments/money"
import { siteOrigin } from "@/lib/site-origin"

/**
 * What is on sale at the counter.
 *
 * A drink is not a class: nothing is reserved, no seat is held, nobody is
 * emailed. Someone scans the QR on the counter, pays, and shows the screen.
 * So this deliberately does not go near sessions, bookings or the payments
 * table — the whole transaction is one PayPal order and a screen.
 *
 * The menu lives in code rather than the database because it is one price that
 * changes about as often as a deploy does, and a table would drag an admin
 * screen, a migration on three databases and an RLS policy behind it. Adding a
 * second drink is one more object below; when there are enough of them that
 * editing this file is the wrong way to change a price, that is the signal to
 * move it, and the shape here is already the shape a row would have.
 *
 * Priced in USD because PayPal cannot charge won. That is not a preference —
 * Toss is suspended until the merchant re-review passes (see TOSS_SUSPENDED in
 * lib/payments/money.ts), and until then dollars are the only online option.
 */

export type Drink = {
  /**
   * Goes into the PayPal order as custom_id, so the dashboard says which item
   * was sold. Nothing here writes to our database, which makes PayPal's own
   * record the only ledger there is — it should be able to name the thing.
   */
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

/** What /drinks sells when the URL names nothing. One drink, one QR. */
export const DEFAULT_DRINK_ID = "drink"

/**
 * The item being bought, or null.
 *
 * Every price the customer is charged is read through here on the server. The
 * browser only ever sends an id, so there is no amount for it to change.
 */
export function findDrink(id: string): Drink | null {
  return DRINKS.find((drink) => drink.id === id) ?? null
}

/**
 * The address the counter QR points at.
 *
 * siteOrigin rather than deploymentOrigin, for the same reason the referral
 * cards use it: this gets printed and stuck to a counter, and a preview URL
 * would work for a week and then stop.
 */
export function drinksLink(): string {
  return new URL("/drinks", siteOrigin()).toString()
}

/** The PayPal custom_id for a drink order: enough to identify it in a refund. */
export function drinkReference(drink: Drink): string {
  return `drink:${drink.id}`
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
