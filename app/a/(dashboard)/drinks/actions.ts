"use server"

import { revalidatePath } from "next/cache"
import { requireAdminSession } from "@/lib/auth/require-session"
import { refundCapture } from "@/lib/payments/paypal"
import { DEFAULT_DRINK_ID, findDrink } from "@/lib/drinks/menu"
import {
  createDrinkOrder,
  drinkOrderUrl,
  getDrinkOrderAs,
  markDrinkOrderRefunded,
  type DrinkOrderStatus,
} from "@/lib/drinks/orders"
import { referralQrSvg } from "@/lib/referrals/queries"
import { formatMoney } from "@/lib/payments/money"
import type { CounterOrder } from "@/components/admin/drink-order-card"

export type RingUpState = { error?: string; order?: CounterOrder }

/**
 * Ring up a drink under a name and hand back everything the screen needs.
 *
 * It used to redirect to /a/drinks?order=<id>, which was addressable and slow:
 * showing a QR cost a whole second page render — two auth round trips and two
 * queries — to display something this call already had. Drawing the QR is a
 * millisecond of CPU, so it is done here and returned, and the counter puts it
 * on screen without going anywhere.
 *
 * The address is not lost: the page still renders ?order= on its own, so a
 * reload or a second screen gets the same QR. The client just updates the URL
 * without navigating.
 */
export async function ringUpDrink(
  _prev: RingUpState,
  formData: FormData,
): Promise<RingUpState> {
  try {
    const { supabase, userId } = await requireAdminSession()
    const nickname = String(formData.get("nickname") ?? "")
    const drink = findDrink(String(formData.get("itemId") ?? DEFAULT_DRINK_ID))
    if (!drink) return { error: "판매하지 않는 품목입니다." }

    const order = await createDrinkOrder(supabase, {
      nickname,
      drink,
      createdBy: userId,
    })

    const url = drinkOrderUrl(order.id)
    // Deliberately not revalidatePath. Marking this page dirty makes Next
    // re-render it and ship the payload back with this response — the very
    // page render this was meant to avoid, reintroduced by a one-line habit.
    // The list below is one row stale until the drink is paid for, and that is
    // exactly when the poll refreshes it.

    return {
      order: {
        id: order.id,
        nickname: order.nickname,
        itemName: order.itemName,
        price: formatMoney(order.price),
        status: order.status,
        createdAt: order.createdAt,
        url,
        qrSvg: await referralQrSvg(url),
      },
    }
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "주문을 만들지 못했습니다.",
    }
  }
}

/**
 * Just the status of one order.
 *
 * What the counter is actually waiting for. Refreshing the whole page to find
 * it out cost two auth round trips and two queries every few seconds, to learn
 * one word — and re-rendered the screen under whoever was using it. This is a
 * single row read, and the page is only refreshed once, when the answer
 * changes and the list below is genuinely stale.
 */
export async function drinkOrderStatus(
  orderId: string,
): Promise<DrinkOrderStatus | null> {
  const { supabase } = await requireAdminSession()
  const order = await getDrinkOrderAs(supabase, orderId)
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
export async function refundDrinkOrder(
  _prev: RefundState,
  formData: FormData,
): Promise<RefundState> {
  try {
    const { supabase } = await requireAdminSession()
    const orderId = String(formData.get("orderId") ?? "")

    const order = await getDrinkOrderAs(supabase, orderId)
    if (!order) return { error: "주문을 찾을 수 없습니다." }
    if (order.status === "refunded") return { error: "이미 환불된 주문입니다." }
    if (order.status !== "paid" || !order.paypalCaptureId) {
      return { error: "결제되지 않은 주문은 환불할 수 없습니다." }
    }

    const refund = await refundCapture(order.paypalCaptureId)
    await markDrinkOrderRefunded(supabase, order.id, refund.refundId)

    revalidatePath("/a/drinks")
    return { done: true }
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "환불하지 못했습니다.",
    }
  }
}
