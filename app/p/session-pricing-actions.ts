"use server"

import { revalidatePath } from "next/cache"
import { requirePartnerSession } from "@/lib/auth/require-partner-session"
import type { DiscountType } from "@/lib/payments/money"

export type PricingInput = {
  priceCurrency: "KRW" | "USD"
  priceAmount: number
  /** Null = no child rate on this class. 0 = children attend free. */
  childPriceAmount: number | null
  discountType: DiscountType | null
  discountValue: number | null
}

export type PricingResult = { ok: true } | { ok: false; error: string }

/**
 * Save price and discount for one of the caller's own classes.
 *
 * Ownership and the value rules are enforced in set_session_pricing, which
 * runs as definer and writes only the pricing columns — a partner must not be
 * able to touch the rest of the session. This wrapper exists to surface the
 * error as a message and to refresh the pages that show a price.
 */
export async function saveSessionPricing(
  sessionId: string,
  input: PricingInput,
): Promise<PricingResult> {
  const { supabase } = await requirePartnerSession()

  const { error } = await supabase.rpc("set_session_pricing", {
    p_session_id: sessionId,
    p_price_currency: input.priceCurrency,
    p_price_amount: input.priceAmount,
    p_discount_type: input.discountType,
    p_discount_value: input.discountType ? input.discountValue : null,
    p_child_price_amount: input.childPriceAmount,
  })

  if (error) return { ok: false, error: error.message }

  revalidatePath("/p")
  revalidatePath(`/p/sessions/${sessionId}/pricing`)
  // The public schedule and booking page show the price too.
  revalidatePath("/")
  revalidatePath(`/book/${sessionId}`)
  return { ok: true }
}
