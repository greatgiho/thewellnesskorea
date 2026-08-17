import { qrFilename, siteLink } from "@/lib/referrals/links"
import { QrBlock } from "@/components/referrals/qr-block"
import { CopyLinkButton } from "@/components/referrals/copy-link-button"

/**
 * The house QR: our own address, on our own posters.
 *
 * No referral code on it, deliberately. Nobody is owed anything for a poster
 * we printed ourselves, and a code here would put a line in the settlement
 * list that can never be paid — which is the kind of line someone eventually
 * tries to pay.
 *
 * Nothing to create and nothing to store: the address does not change, so the
 * QR is the same every time this page is opened.
 */
export function SiteQrPanel() {
  const link = siteLink()

  return (
    <section className="rounded-3xl border border-border bg-card p-6 sm:p-8">
      <h2 className="font-serif text-xl text-foreground">사이트 QR</h2>
      <p className="mt-2 text-sm text-muted-foreground">
        인쇄물·명함·간판에 쓰는 홈 랜딩 QR 입니다.
      </p>

      <div className="mt-6 flex flex-col gap-6 sm:flex-row sm:items-start">
        <QrBlock link={link} filename={qrFilename("사이트")} size="lg" />
        <div className="min-w-0">
          <p className="break-all font-mono text-sm text-foreground">{link}</p>
          <div className="mt-3">
            <CopyLinkButton link={link} />
          </div>
        </div>
      </div>
    </section>
  )
}
