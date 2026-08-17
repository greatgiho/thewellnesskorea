import Link from "next/link"
import { listReferralPartners, referralTallies } from "@/lib/referrals/queries"
import { totalsByCode, type ReferralTotals } from "@/lib/referrals/tally"
import { partnerPath, qrFilename, referralLink } from "@/lib/referrals/links"
import { formatMoney, type Money } from "@/lib/payments/money"
import { QrBlock } from "@/components/referrals/qr-block"
import { CopyLinkButton } from "@/components/referrals/copy-link-button"
import { CreatePartnerReferrerButton } from "@/components/referrals/create-partner-referrer-button"
import type { PartnerKind } from "@/lib/partners/types"

/**
 * One QR per teacher, made when someone asks for it.
 *
 * The list is always here; the QR is not. Drawing a code for every partner on
 * every load would render dozens of images nobody asked to see, so opening one
 * is a link — the page comes back with that partner's QR and no others. That
 * also means the address in the browser points at the teacher you are looking
 * at, which is what gets pasted into a message.
 */
export async function PartnerReferralsPanel({
  base,
  selectedId,
}: {
  base: string
  selectedId?: string
}) {
  const [partners, tallies] = await Promise.all([
    listReferralPartners(),
    referralTallies(),
  ])
  const totals = totalsByCode(tallies)
  const selected = partners.find((p) => p.id === selectedId)

  return (
    <div className="space-y-6">
      {selected ? (
        <section className="rounded-3xl border border-border bg-card p-6 sm:p-8">
          <div className="flex flex-wrap items-baseline justify-between gap-3">
            <h2 className="font-serif text-xl text-foreground">
              {selected.name}
              {!selected.isPublished ? (
                <span className="ml-1.5 align-middle text-sm text-muted-foreground/60">
                  (비공개)
                </span>
              ) : null}
            </h2>
            <Link
              href={`${base}/partners`}
              className="text-xs text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
            >
              닫기
            </Link>
          </div>

          {selected.referrer ? (
            <PartnerQr
              link={referralLink(
                selected.referrer.code,
                partnerPath(selected.slug),
              )}
              code={selected.referrer.code}
              filename={qrFilename(selected.referrer.code)}
              totals={totals.get(selected.referrer.code.toLowerCase())}
            />
          ) : (
            <div className="mt-4">
              <p className="mb-3 text-sm text-muted-foreground">
                아직 레퍼럴이 없습니다.
              </p>
              <CreatePartnerReferrerButton partnerId={selected.id} />
            </div>
          )}
        </section>
      ) : null}

      <section className="rounded-3xl border border-border bg-card p-6 sm:p-8">
        <h2 className="font-serif text-xl text-foreground">파트너</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          소개 페이지로 착지합니다.
        </p>

        {partners.length === 0 ? (
          <p className="mt-6 text-sm text-muted-foreground">
            등록된 파트너가 없습니다.
          </p>
        ) : (
          <ul className="mt-6 divide-y divide-border/60">
            {partners.map((p) => (
              <li
                key={p.id}
                className="flex flex-wrap items-center justify-between gap-3 py-3"
              >
                <div className="min-w-0">
                  <Link
                    href={`${base}/partners?p=${p.id}`}
                    scroll={false}
                    className={`text-sm underline-offset-4 hover:underline ${
                      p.id === selectedId
                        ? "font-medium text-foreground"
                        : "text-foreground"
                    }`}
                  >
                    {p.name}
                  </Link>
                  {!p.isPublished ? (
                    <span className="ml-1.5 text-xs text-muted-foreground/60">
                      (비공개)
                    </span>
                  ) : null}
                  <KindBadge kind={p.kind} />
                </div>

                {p.referrer ? (
                  <span className="font-mono text-xs text-muted-foreground">
                    {p.referrer.code}
                  </span>
                ) : (
                  <CreatePartnerReferrerButton
                    partnerId={p.id}
                    label="만들기"
                  />
                )}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}

/**
 * A colour per kind, so the list can be scanned rather than read. Same
 * tint-plus-darker-text shape the other badges in the admin use.
 */
const KIND_STYLE: Record<PartnerKind, string> = {
  guide: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
  artist: "bg-violet-500/10 text-violet-700 dark:text-violet-300",
  both: "bg-sky-500/10 text-sky-700 dark:text-sky-300",
  brand: "bg-amber-500/10 text-amber-700 dark:text-amber-300",
}

function KindBadge({ kind }: { kind: string }) {
  const style = KIND_STYLE[kind as PartnerKind] ?? "bg-muted text-muted-foreground"
  return (
    <span
      className={`ml-2 rounded-full px-2 py-0.5 text-[11px] font-medium ${style}`}
    >
      {kind}
    </span>
  )
}

function PartnerQr({
  link,
  code,
  filename,
  totals,
}: {
  link: string
  code: string
  filename: string
  totals: ReferralTotals | undefined
}) {
  return (
    <div className="mt-5 flex flex-col gap-6 sm:flex-row sm:items-start">
      <QrBlock link={link} filename={filename} size="lg" />
      <div className="min-w-0">
        <p className="font-mono text-xs text-muted-foreground">{code}</p>
        <p className="mt-1 break-all font-mono text-sm text-foreground">
          {link}
        </p>
        <div className="mt-3">
          <CopyLinkButton link={link} />
        </div>
        <p className="mt-4 text-sm text-muted-foreground">
          <span className="text-foreground">확정 {totals?.confirmed ?? 0}건</span>
          {totals && totals.total !== totals.confirmed
            ? ` (전체 ${totals.total}건)`
            : null}
          {totals?.revenue.length
            ? ` · ${totals.revenue.map((m) => formatMoney(m as Money)).join(", ")}`
            : null}
        </p>
      </div>
    </div>
  )
}
