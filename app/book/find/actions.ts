"use server"

import { sendBookingLookupEmail } from "@/lib/bookings/lookup"
import { asActionResult, type ActionResult } from "@/lib/errors"

/**
 * Ask for the booking links to be sent again.
 *
 * Always reports success. Whether the address has bookings, has none, or is
 * being throttled is not the asker's business — they may not be the person who
 * owns it. The only failure this reports is one that stopped it from trying at
 * all, and even that is generic.
 */
export async function requestBookingLinks(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  return asActionResult(
    "requestBookingLinks",
    "요청을 처리하지 못했습니다. 잠시 후 다시 시도해 주세요.",
    async () => {
      const email = String(formData.get("email") ?? "")
      // No format check beyond "has an @": rejecting an address our own mail
      // provider would have accepted teaches the customer nothing, and the
      // send is a no-op for anything that does not match a booking anyway.
      if (!email.includes("@")) return
      await sendBookingLookupEmail(email)
    },
  )
}
