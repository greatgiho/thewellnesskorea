import { referralLink, referralQrSvg, type Referrer, type ReferrerStats } from "@/lib/referrals/queries"
import { ReferrerToggle } from "@/components/admin/referrer-toggle"
import { CopyLinkButton } from "@/components/admin/copy-link-button"

/**
 * One partner: their link, the QR to print, and what has come of it.
 *
 * The QR is rendered here on the server rather than fetched, so the page can
 * be printed straight from the browser — which is how these actually get to a
 * café counter.
 */
export async function ReferrerCard({
  referrer,
  stats,
}: {
  referrer: Referrer
  stats: ReferrerStats | undefined
}) {
  const link = referralLink(referrer.code)
  const qr = await referralQrSvg(link)

  return (
    <section
      className={`rounded-3xl border p-6 sm:p-8 ${
        referrer.isActive
          ? "border-border bg-card"
          : "border-dashed border-border bg-muted/30"
      }`}
    >
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h3 className="font-serif text-xl text-foreground">
            {referrer.name}
            {!referrer.isActive ? (
              <span className="ml-2 align-middle text-xs text-muted-foreground">
                비활성
              </span>
            ) : null}
          </h3>
          <p className="mt-1 font-mono text-xs text-muted-foreground">
            {referrer.code}
          </p>
          {referrer.note ? (
            <p className="mt-2 max-w-md text-sm text-muted-foreground">
              {referrer.note}
            </p>
          ) : null}
        </div>
        <ReferrerToggle id={referrer.id} isActive={referrer.isActive} />
      </div>

      <div className="mt-6 flex flex-col gap-6 sm:flex-row">
        <div className="w-full max-w-[180px] shrink-0 rounded-2xl bg-white p-3 [&>svg]:h-auto [&>svg]:w-full"
          dangerouslySetInnerHTML={{ __html: qr }}
        />

        <div className="min-w-0 flex-1 space-y-4">
          <div>
            <p className="text-xs uppercase tracking-wider text-muted-foreground">
              링크
            </p>
            <p className="mt-1 break-all font-mono text-xs text-foreground">
              {link}
            </p>
            <div className="mt-2">
              <CopyLinkButton link={link} />
            </div>
          </div>

          <dl className="grid grid-cols-3 gap-3 text-sm">
            <div>
              <dt className="text-xs text-muted-foreground">전체 예약</dt>
              <dd className="mt-0.5 text-foreground">{stats?.total ?? 0}</dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">확정</dt>
              <dd className="mt-0.5 text-foreground">{stats?.confirmed ?? 0}</dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">취소·미결제</dt>
              <dd className="mt-0.5 text-muted-foreground">
                {stats?.lost ?? 0}
              </dd>
            </div>
          </dl>

          <div>
            <p className="text-xs uppercase tracking-wider text-muted-foreground">
              결제액 (환불 제외)
            </p>
            {stats?.revenue.length ? (
              <ul className="mt-1 space-y-0.5">
                {stats.revenue.map((r) => (
                  <li key={r.currency} className="text-sm text-foreground">
                    {new Intl.NumberFormat(
                      r.currency === "KRW" ? "ko-KR" : "en-US",
                      {
                        style: "currency",
                        currency: r.currency,
                        ...(r.currency === "KRW"
                          ? { maximumFractionDigits: 0 }
                          : {}),
                      },
                    ).format(r.amount)}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-1 text-sm text-muted-foreground">—</p>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}
