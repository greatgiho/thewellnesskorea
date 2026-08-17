import "server-only"

import { revalidatePath } from "next/cache"

/**
 * Every referral screen, after a write.
 *
 * "layout" rather than the bare path: the same rows appear on four tabs under
 * each of /a and /v, and a seed made on one tab has to exist on the next. The
 * two roles are also looking at this together, which is when a stale QR gets
 * handed out.
 */
export function revalidateReferralScreens(): void {
  revalidatePath("/a/referrals", "layout")
  revalidatePath("/v/referrals", "layout")
  // A teacher's code can also be made from their own admin page, and that page
  // shows the QR once it exists.
  revalidatePath("/a/partners", "layout")
}
