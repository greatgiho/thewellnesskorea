"use server"

import { createOrder, captureOrder } from "@/lib/payments/paypal"
import {
  drinkReference,
  findDrink,
  receiptCode,
  type Drink,
} from "@/lib/drinks/menu"
import { formatMoney, money, toPaypalAmount } from "@/lib/payments/money"

/**
 * Buying a drink over the counter.
 *
 * Deliberately shorter than app/book/paypal-actions.ts, because there is
 * nothing to protect between the two calls. A class has a seat held under a
 * timer and a row that must end up agreeing with PayPal, so its capture goes
 * through finalizePaidBooking and a webhook. A drink has none of that: the
 * money moves, the screen says so, someone makes the drink.
 *
 * Which means PayPal's own record is the only ledger. That is a real choice
 * and its cost is that sales cannot be listed in the admin — worth revisiting
 * once there is more than one item, not worth a table today.
 */

function requireDrink(drinkId: string): Drink {
  const drink = findDrink(drinkId)
  if (!drink) throw new Error("That item is not for sale.")
  return drink
}

/**
 * Start a PayPal order for one drink.
 *
 * The browser sends an id, never an amount. The price is read from the menu
 * here, so the only number PayPal is ever told comes from the server — there
 * is nothing on the page for a customer to edit down to a dollar.
 */
export async function createDrinkOrder(drinkId: string): Promise<string> {
  const drink = requireDrink(drinkId)
  const order = await createOrder({
    amount: toPaypalAmount(drink.price),
    currency: drink.price.currency,
    reference: drinkReference(drink),
    description: drink.name,
  })
  return order.id
}

/** What the customer holds up at the counter. */
export type DrinkReceipt = {
  /** Short code off the capture id, for reading aloud or checking in PayPal. */
  code: string
  name: string
  /** Already formatted: the amount PayPal confirmed, not the one we asked for. */
  amount: string
  /** When the capture came back COMPLETED. */
  paidAt: string
}

export type DrinkPaymentResult =
  | { ok: true; receipt: DrinkReceipt }
  | { ok: false; pending: true }
  | { ok: false; pending?: false; status: string }

/**
 * Capture an approved order and turn it into a receipt.
 *
 * Judged on the capture status rather than the order status, the same way the
 * booking flow is: COMPLETED is the only one that means the money is ours.
 *
 * PENDING is money taken and held for review, which can take days. For a class
 * that is survivable — the seat stays held and a webhook settles it. For a
 * drink it is not, so it is reported as unpaid rather than as a receipt: the
 * one thing that must not happen is a screen that says paid over a payment
 * that might still be refused.
 */
export async function captureDrinkOrder(
  drinkId: string,
  orderId: string,
): Promise<DrinkPaymentResult> {
  const drink = requireDrink(drinkId)
  const result = await captureOrder(orderId)

  if (result.captureStatus === "PENDING") return { ok: false, pending: true }
  if (result.captureStatus !== "COMPLETED") {
    return { ok: false, status: result.captureStatus ?? result.status ?? "UNKNOWN" }
  }

  // The order was created here, so a mismatch is not something a customer can
  // cause — it would mean PayPal captured an amount we never asked for. Cheap
  // to check, and the alternative is printing a receipt for the wrong price.
  const paid =
    result.amount != null && result.currency != null
      ? money(result.currency, result.amount)
      : null
  if (
    paid &&
    (paid.currency !== drink.price.currency || paid.amount !== drink.price.amount)
  ) {
    return { ok: false, status: "AMOUNT_MISMATCH" }
  }

  return {
    ok: true,
    receipt: {
      code: receiptCode(result.captureId ?? orderId),
      name: drink.name,
      amount: formatMoney(paid ?? drink.price),
      paidAt: new Date().toISOString(),
    },
  }
}
