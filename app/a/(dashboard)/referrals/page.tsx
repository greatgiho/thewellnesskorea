import type { Metadata } from "next"
import { requireAdminSession } from "@/lib/auth/require-session"
import { ReferralScreen } from "@/components/referrals/referral-screen"

export const metadata: Metadata = {
  title: "레퍼럴 — Admin",
}

export default async function AdminReferralsPage() {
  await requireAdminSession()
  return <ReferralScreen />
}
