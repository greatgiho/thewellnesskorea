import type { Money } from "@/lib/payments/money"

/**
 * What is on sale at the counter.
 *
 * A beverage is not a class: nothing is reserved, no seat is held, nobody is
 * emailed. It is rung up under a name, paid for from a QR, and handed over.
 * So this deliberately does not go near sessions or the payments table — a
 * counter sale is beverage_orders (065) and one PayPal order.
 *
 * The menu lives in code rather than the database because it is a couple of
 * prices that change about as often as a deploy does, and a table would drag an
 * admin screen, a migration on three databases and an RLS policy behind it.
 * Another beverage is one more object below; when there are enough of them that
 * editing this file is the wrong way to change a price, that is the signal to
 * move it, and the shape here is already the shape a row would have.
 *
 * Nothing reads this after a sale is rung up. beverage_orders copies the name
 * and the price onto the row, so changing a price here cannot rewrite what
 * someone was charged last week.
 *
 * Priced in USD because PayPal cannot charge won. That is not a preference —
 * Toss is suspended until the merchant re-review passes (see TOSS_SUSPENDED in
 * lib/payments/money.ts), and until then dollars are the only online option.
 */

export type Beverage = {
  /** Recorded on the order as item_id, so a sale can name what it was for. */
  id: string
  /** What is actually charged. The order row is written from this. */
  price: Money
  /**
   * What the counter sells it for — the number on the sign, in the currency
   * the shop thinks in. Also the item's whole identity: what is actually in
   * the cup is settled at the counter, out loud, and the price is the only
   * part of it this ever needs to know.
   *
   * Not derived from `price`, and `price` is not derived from it. A rate that
   * moved between quoting and charging would make the two disagree by a few
   * won every day, and the amount charged has to be a number somebody chose.
   * So the won is the intent, the dollars are the charge, and bringing them
   * back together when the rate has drifted is a deliberate edit here.
   *
   * There is deliberately no name field. Two prices is what distinguishes the
   * two things on sale; a name alongside would be the same fact written twice,
   * and the copy that went stale would be the one on a customer's receipt.
   */
  listPriceKrw: number
}

/**
 * Priced at ₩1,391.03/USD (2026-08-20), which puts ₩5,000 at $3.59 and ₩8,000
 * at $5.75. Rounded to the cent the customer is charged: $3.60 is ₩5,008 and
 * $5.75 is ₩7,998.
 *
 * What arrives is less. After PayPal's 4.4% + $0.30 and the 3% conversion
 * spread on withdrawal, $3.60 nets about ₩4,240 and $5.75 about ₩7,010 — 15%
 * and 12% gone. The fixed $0.30 is what does it, and it hurts the cheaper item
 * roughly twice as hard, because it is the same $0.30 either way.
 */
export const BEVERAGES: Beverage[] = [
  { id: "beverage-5000", price: { currency: "USD", amount: 3.6 }, listPriceKrw: 5000 },
  { id: "beverage-8000", price: { currency: "USD", amount: 5.75 }, listPriceKrw: 8000 },
]

/** What the counter rings up when nothing else is chosen. */
export const DEFAULT_BEVERAGE_ID = "beverage-5000"

/**
 * The item being sold, or null.
 *
 * Every price is read through here on the server, at the moment a sale is rung
 * up. The browser only ever sends an id, so there is no amount for anyone to
 * change on the way past.
 */
export function findBeverage(id: string): Beverage | null {
  return BEVERAGES.find((beverage) => beverage.id === id) ?? null
}

/**
 * The sign price: "₩5,000".
 *
 * Both what the counter picks by and what the item is called — on the button,
 * on the card, on the row, and on PayPal's own screen. One string, so there is
 * no second spelling of the same item to drift.
 */
export function formatListPrice(beverage: Beverage): string {
  return new Intl.NumberFormat("ko-KR", {
    style: "currency",
    currency: "KRW",
    maximumFractionDigits: 0,
  }).format(beverage.listPriceKrw)
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
