import type { Metadata } from "next"
import { requireViewerSession } from "@/lib/auth/require-viewer-session"
import { ReferralScreen } from "@/components/referrals/referral-screen"

export const metadata: Metadata = {
  title: "레퍼럴 — The Wellness Korea",
}

/**
 * The same screen an admin gets.
 *
 * The one place /v is not read-only. Viewers manage referrals because they are
 * the ones doing it — see 063 for why that rule was broken here and nowhere
 * else. The writes still go through their own client, so the database, not
 * this page, is what decides they are allowed.
 */
export default async function ViewerReferralsPage() {
  await requireViewerSession()
  return <ReferralScreen />
}
