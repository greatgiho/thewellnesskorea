import type { Metadata } from "next"
import { requireViewerSession } from "@/lib/auth/require-viewer-session"
import { BookingReferralsPanel } from "@/components/referrals/booking-referrals-panel"

export const metadata: Metadata = {
  title: "예약 레퍼럴 — 레퍼럴",
}

export default async function Page() {
  await requireViewerSession()
  return <BookingReferralsPanel />
}
