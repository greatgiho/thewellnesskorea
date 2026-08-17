import { ReferralTabs } from "@/components/referrals/referral-tabs"

/**
 * Heading and tab bar, kept out of the pages so switching tabs does not redraw
 * them — and so a new tab is one route, not one more copy of this.
 */
export default function ReferralsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-3xl text-foreground">레퍼럴 · QR</h1>
      </div>
      <ReferralTabs base="/a/referrals" />
      {children}
    </div>
  )
}
