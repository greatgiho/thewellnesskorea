"use server"

import { createOrder, captureOrder } from "@/lib/payments/paypal"

function assertDev() {
  const enabled =
    process.env.NODE_ENV !== "production" ||
    process.env.ENABLE_DEV_PAYMENTS === "true"
  if (!enabled) {
    throw new Error("Dev payments harness is not enabled.")
  }
}

export async function createPaypalOrder(): Promise<string> {
  assertDev()
  const order = await createOrder({
    amount: "1.00",
    currency: "USD",
    reference: "dev-payments-harness",
  })
  return order.id
}

export async function capturePaypalOrder(
  orderId: string,
): Promise<{ status: string; captureId?: string; amount?: string; currency?: string }> {
  assertDev()
  const result = await captureOrder(orderId)
  return {
    status: result.status,
    captureId: result.captureId,
    amount: result.amount,
    currency: result.currency,
  }
}
