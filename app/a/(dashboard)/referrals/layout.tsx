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
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
          코드가 붙은 링크로 들어온 방문자가 예약하면 그 예약에 코드가 남습니다.
          정산은 이 숫자를 보고 직접 하시면 됩니다 — 자동 송금은 없습니다.
        </p>
      </div>
      <ReferralTabs base="/a/referrals" />
      {children}
    </div>
  )
}
