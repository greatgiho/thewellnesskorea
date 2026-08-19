"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { isRedirectError } from "next/dist/client/components/redirect-error"
import { requireAdminSession } from "@/lib/auth/require-session"
import { refundCapture } from "@/lib/payments/paypal"
import { DEFAULT_DRINK_ID, findDrink } from "@/lib/drinks/menu"
import {
  createDrinkOrder,
  getDrinkOrderAs,
  markDrinkOrderRefunded,
} from "@/lib/drinks/orders"

export type RingUpState = { error?: string }

/**
 * Ring up a drink under a name and put its QR on screen.
 *
 * Redirects rather than returning the order, so the QR lives at an address.
 * A barista who loses the tab, or wants it on the second screen, can get back
 * to the same QR — and reloading does not ring up a second drink.
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

    revalidatePath("/a/drinks")
    redirect(`/a/drinks?order=${order.id}`)
  } catch (error) {
    if (isRedirectError(error)) throw error
    return {
      error: error instanceof Error ? error.message : "주문을 만들지 못했습니다.",
    }
  }
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
