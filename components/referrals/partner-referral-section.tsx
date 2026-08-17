import Link from "next/link"
import { listReferralPartners } from "@/lib/referrals/queries"
import { partnerPath, qrFilename, referralLink } from "@/lib/referrals/links"
import { QrBlock } from "@/components/referrals/qr-block"
import { CopyLinkButton } from "@/components/referrals/copy-link-button"
import { CreatePartnerReferrerButton } from "@/components/referrals/create-partner-referrer-button"

/**
 * This partner's QR, on this partner's own admin page.
 *
 * The same button lives on the referral screen. Two doors to one row is on
 * purpose: whoever is looking at the teacher when the question comes up should
 * be able to answer it without learning where else it lives. The action is
 * idempotent, so both doors leading to the same code is the expected outcome,
 * not a race.
 */
export async function PartnerReferralSection({
  partnerId,
}: {
  partnerId: string
}) {
  const partners = await listReferralPartners()
  const partner = partners.find((p) => p.id === partnerId)
  if (!partner) return null

  return (
    <section className="rounded-2xl border border-border bg-card/40 p-6">
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <h3 className="font-medium text-foreground">레퍼럴 QR</h3>
        <Link
          href={`/a/referrals/partners?p=${partner.id}`}
          className="text-xs text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
        >
          레퍼럴 화면에서 보기
        </Link>
      </div>

      {partner.referrer ? (
        <div className="mt-4 flex flex-col gap-5 sm:flex-row sm:items-start">
          <QrBlock
            link={referralLink(partner.referrer.code, partnerPath(partner.slug))}
            filename={qrFilename(partner.referrer.code)}
          />
          <div className="min-w-0">
            <p className="font-mono text-xs text-muted-foreground">
              {partner.referrer.code}
              {!partner.referrer.isActive ? (
                <span className="ml-2">비활성</span>
              ) : null}
            </p>
            <p className="mt-1 break-all font-mono text-xs text-foreground">
              {referralLink(partner.referrer.code, partnerPath(partner.slug))}
            </p>
            <div className="mt-2">
              <CopyLinkButton
                link={referralLink(
                  partner.referrer.code,
                  partnerPath(partner.slug),
                )}
              />
            </div>
          </div>
        </div>
      ) : (
        <div className="mt-4">
          <p className="mb-3 text-sm text-muted-foreground">
            이 파트너의 QR 이 아직 없습니다. 만들면 자기 소개 페이지로 가는
            링크가 생기고, 거기로 들어온 예약이 이 사람 몫으로 잡힙니다.
          </p>
          <CreatePartnerReferrerButton partnerId={partner.id} />
        </div>
      )}
    </section>
  )
}
