"use server"

import { revalidatePath } from "next/cache"
import { requireAdminSession } from "@/lib/auth/require-session"
import { refundCapture } from "@/lib/payments/paypal"
import { DEFAULT_BEVERAGE_ID, findBeverage } from "@/lib/beverages/menu"
import {
  createBeverageOrder,
  getBeverageOrderAs,
  markBeverageOrderRefunded,
  type BeverageOrderStatus,
} from "@/lib/beverages/orders"
import { toCounterOrder, type CounterOrder } from "@/lib/beverages/counter"

export type RingUpState = { error?: string; order?: CounterOrder }

/**
 * Ring up a beverage under a name and hand back everything the screen needs.
 *
 * It used to redirect, which was slow: showing a QR cost a whole second page
 * render — two auth round trips and two queries — to display something this
 * call already had. Drawing the QR is a millisecond of CPU, so it is done here
 * and returned, and the counter puts it on screen without going anywhere.
 */
export async function ringUpBeverage(
  _prev: RingUpState,
  formData: FormData,
): Promise<RingUpState> {
  try {
    const { supabase, userId } = await requireAdminSession()
    const nickname = String(formData.get("nickname") ?? "")
    const beverage = findBeverage(
      String(formData.get("itemId") ?? DEFAULT_BEVERAGE_ID),
    )
    if (!beverage) return { error: "판매하지 않는 품목입니다." }

    const order = await createBeverageOrder(supabase, {
      nickname,
      beverage,
      createdBy: userId,
    })

    // Deliberately not revalidatePath. Marking this page dirty makes Next
    // re-render it and ship the payload back with this response — the very
    // page render this was meant to avoid. Nothing below needs telling either:
    // the list is sales, and this is not one until somebody pays.
    return { order: await toCounterOrder(order) }
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "주문을 만들지 못했습니다.",
    }
  }
}

/**
 * One order, ready for the card.
 *
 * What a click in the list calls. It returns the same shape ringUpBeverage
 * does, so the card has one source and the screen has one way to change what
 * it is showing — which is the whole point of it not being in the address.
 */
export async function loadCounterOrder(
  orderId: string,
): Promise<CounterOrder | null> {
  const { supabase } = await requireAdminSession()
  const order = await getBeverageOrderAs(supabase, orderId)
  return order ? await toCounterOrder(order) : null
}

/**
 * Just the status of one order.
 *
 * What the counter is waiting for. Refreshing the whole page to find it out
 * cost two auth round trips and two queries every few seconds, to learn one
 * word — and re-rendered the screen under whoever was using it.
 */
export async function beverageOrderStatus(
  orderId: string,
): Promise<BeverageOrderStatus | null> {
  const { supabase } = await requireAdminSession()
  const order = await getBeverageOrderAs(supabase, orderId)
  return order?.status ?? null
}

export type RefundState = { error?: string; done?: boolean }

/**
 * Give one order back.
 *
 * PayPal first, our row second. A refund recorded before PayPal agrees to it
 * is a row claiming money went back that never did — the one direction of this
 * mistake nobody catches, because the customer who was not refunded is the
 * only person who would notice and they have already been told it was done.
 */
export async function refundBeverageOrder(
  _prev: RefundState,
  formData: FormData,
): Promise<RefundState> {
  try {
    const { supabase } = await requireAdminSession()
    const orderId = String(formData.get("orderId") ?? "")

    const order = await getBeverageOrderAs(supabase, orderId)
    if (!order) return { error: "주문을 찾을 수 없습니다." }
    if (order.status === "refunded") return { error: "이미 환불된 주문입니다." }
    if (order.status !== "paid" || !order.paypalCaptureId) {
      return { error: "결제되지 않은 주문은 환불할 수 없습니다." }
    }

    const refund = await refundCapture(order.paypalCaptureId)
    await markBeverageOrderRefunded(supabase, order.id, refund.refundId)

    revalidatePath("/a/beverages")
    return { done: true }
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "환불하지 못했습니다.",
    }
  }
}
