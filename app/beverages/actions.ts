"use server"

import { createOrder, captureOrder } from "@/lib/payments/paypal"
import { receiptCode } from "@/lib/beverages/menu"
import {
  getBeverageOrder,
  markBeverageOrderPaid,
  type BeverageOrder,
} from "@/lib/beverages/orders"
import { formatMoney, money, toPaypalAmount } from "@/lib/payments/money"

/**
 * Paying for a beverage someone already rang up.
 *
 * Every amount comes off the order row, never off the request. The browser
 * sends an order id and nothing else, so there is no price on the page for a
 * customer to edit — the same arrangement the booking flow has, for the same
 * reason.
 */

async function pendingOrder(orderId: string): Promise<BeverageOrder> {
  const order = await getBeverageOrder(orderId)
  if (!order) throw new Error("주문을 찾을 수 없습니다.")
  if (order.status === "paid") throw new Error("This order is already paid.")
  if (order.status === "refunded") throw new Error("This order was refunded.")
  return order
}

export async function createBeveragePaypalOrder(orderId: string): Promise<string> {
  const order = await pendingOrder(orderId)
  const paypal = await createOrder({
    amount: toPaypalAmount(order.price),
    currency: order.price.currency,
    // The row is the ledger now, so this only has to lead back to it.
    reference: `beverage:${order.id}`,
    // Carries the name because PayPal's own screen is the last thing the
    // customer reads before committing, and it should say whose beverage it is.
    description: `${order.itemName} · ${order.nickname}`,
  })
  return paypal.id
}

/** What the customer holds up, and what the counter list is about to show. */
export type BeverageReceipt = {
  code: string
  nickname: string
  name: string
  amount: string
  paidAt: string
}

export type BeveragePaymentResult =
  | { ok: true; receipt: BeverageReceipt }
  | { ok: false; pending: true }
  | { ok: false; pending?: false; status: string }

/**
 * Capture an approved order and mark the row paid.
 *
 * Judged on the capture status rather than the order status, the same way the
 * booking flow is: COMPLETED is the only one that means the money is ours.
 *
 * PENDING is money taken and held for review, which can take days. For a class
 * that is survivable — the seat stays held and a webhook settles it. For a
 * beverage it is not, so the row stays pending and the screen says so: the one
 * thing that must not happen is a receipt printed over a payment that might
 * still be refused.
 */
export async function captureBeveragePayment(
  orderId: string,
  paypalOrderId: string,
): Promise<BeveragePaymentResult> {
  const order = await pendingOrder(orderId)
  const result = await captureOrder(paypalOrderId)

  if (result.captureStatus === "PENDING") return { ok: false, pending: true }
  if (result.captureStatus !== "COMPLETED") {
    return { ok: false, status: result.captureStatus ?? result.status ?? "UNKNOWN" }
  }

  // The PayPal order was created from this row, so a mismatch would mean
  // PayPal captured an amount we never asked for. Checked before the row is
  // written, because a row saying paid is what a refund is later built on.
  const paid =
    result.amount != null && result.currency != null
      ? money(result.currency, result.amount)
      : null
  if (
    paid &&
    (paid.currency !== order.price.currency || paid.amount !== order.price.amount)
  ) {
    return { ok: false, status: "AMOUNT_MISMATCH" }
  }

  const captureId = result.captureId ?? paypalOrderId
  // Not checked: a QR left on screen can be scanned twice, and the loser of
  // that race is still looking at a paid order. Reporting it as a failure
  // would tell someone their money did not go through when it did.
  await markBeverageOrderPaid(order.id, { orderId: paypalOrderId, captureId })

  return {
    ok: true,
    receipt: {
      code: receiptCode(captureId),
      nickname: order.nickname,
      name: order.itemName,
      amount: formatMoney(paid ?? order.price),
      paidAt: new Date().toISOString(),
    },
  }
}
