import "server-only"

import { referralQrSvg } from "@/lib/referrals/queries"
import { formatMoney } from "@/lib/payments/money"
import { beverageOrderUrl, type BeverageOrder } from "@/lib/beverages/orders"
import { beverageOrderName } from "@/lib/beverages/labels"

/**
 * An order as the counter screen needs it: formatted, with its QR drawn.
 *
 * One place, because two callers want the same thing — ringing one up, and
 * picking one out of the list — and a screen where the same card is built two
 * ways is a screen where the two ways drift.
 */

export type CounterOrder = {
  id: string
  /** What to call them: their nickname, else PayPal's name, else null. */
  name: string | null
  /** How to find this sale in PayPal later. Empty until it is paid. */
  payer: { name?: string; email?: string; accountId?: string; card?: string }
  itemName: string
  price: string
  status: BeverageOrder["status"]
  createdAt: string
  url: string
  /** Drawn only while there is something left to scan. */
  qrSvg: string | null
}

export async function toCounterOrder(order: BeverageOrder): Promise<CounterOrder> {
  const url = beverageOrderUrl(order.id)
  return {
    id: order.id,
    name: beverageOrderName(order),
    payer: order.payer,
    itemName: order.itemName,
    price: formatMoney(order.price),
    status: order.status,
    createdAt: order.createdAt,
    url,
    // A paid or refunded order has no QR left to show, and drawing one would
    // be work for something the card will not render.
    qrSvg: order.status === "pending" ? await referralQrSvg(url) : null,
  }
}
