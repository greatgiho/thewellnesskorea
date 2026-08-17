import "server-only"

import { revalidatePath } from "next/cache"

/**
 * Both referral screens, after a write.
 *
 * The same rows are rendered at /a/referrals and /v/referrals. Revalidating
 * only the one the editor happens to be looking at leaves the other showing a
 * link that has been removed — and the two roles are looking at this together,
 * which is when a stale QR gets handed out.
 */
export function revalidateReferralScreens(): void {
  revalidatePath("/a/referrals")
  revalidatePath("/v/referrals")
}
