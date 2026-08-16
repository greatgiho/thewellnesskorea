import "server-only"

import { cookies } from "next/headers"
import { createServiceClient } from "@/lib/supabase/service"
import { REFERRAL_COOKIE, normalizeReferralCode } from "@/lib/referrals/cookie"

/**
 * Stamp a booking with the referral that was in effect.
 *
 * Runs after the booking exists rather than inside it. create_booking_hold and
 * create_booking are large plpgsql that has been rebuilt five times across 038,
 * 040, 053, 054 and 055, and rebuilding one of them from the wrong base is how
 * every non-coupon booking broke earlier in this project. Threading a referral
 * code through them would mean opening both again to record something that is
 * not part of the transaction's job.
 *
 * The cost is that this can fail on its own. That is the right way round: a
 * missed stamp loses attribution, which is a line in a statement someone can
 * correct by hand. A booking that fails to save loses a customer.
 *
 * Never throws for the same reason — it is called from the booking action, and
 * the booking is already made by the time it runs.
 */
export async function attributeBooking(bookingId: string): Promise<void> {
  try {
    const store = await cookies()
    const code = normalizeReferralCode(store.get(REFERRAL_COOKIE)?.value)
    if (!code) return

    const service = createServiceClient()

    // Only against a referrer that exists and is active. The cookie is set
    // without checking — anyone can type ?ref=anything — so this is where an
    // invented code stops being worth recording. Matched case-insensitively,
    // because a code handed out on paper comes back typed however the person
    // felt about capitals.
    const { data: referrer } = await service
      .from("referrers")
      .select("code")
      .ilike("code", code)
      .eq("is_active", true)
      .maybeSingle<{ code: string }>()

    if (!referrer) return

    // The referrer's own spelling, not the visitor's, so reporting groups
    // cleanly without having to normalise at read time.
    const { error } = await service
      .from("bookings")
      .update({ referral_code: referrer.code })
      .eq("id", bookingId)
      .is("referral_code", null)

    if (error) {
      console.error("[referral] stamp failed:", error.message)
    }
  } catch (err) {
    console.error("[referral] stamp failed:", err)
  }
}
