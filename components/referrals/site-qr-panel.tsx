import { siteLink } from "@/lib/referrals/links"
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
      <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
        우리 인쇄물·명함·간판에 쓰는 QR 입니다. 레퍼럴 코드가 없으므로 정산에는
        잡히지 않습니다 — 누구 몫도 아니니까요.
      </p>

      <div className="mt-6 flex flex-col gap-6 sm:flex-row sm:items-start">
        <QrBlock link={link} size="lg" />
        <div className="min-w-0">
          <p className="break-all font-mono text-sm text-foreground">{link}</p>
          <div className="mt-3">
            <CopyLinkButton link={link} />
          </div>
          <p className="mt-4 max-w-md text-xs leading-relaxed text-muted-foreground">
            누가 데려왔는지 세야 하는 QR 이라면 이게 아니라 <strong>선생</strong> 이나{" "}
            <strong>예약</strong> 탭에서 만드세요. 그쪽은 코드가 붙습니다.
          </p>
        </div>
      </div>
    </section>
  )
}
