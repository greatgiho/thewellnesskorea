import {
  type LinkedSession,
  type ReferralLink,
  type Referrer,
  type ReferrerStats,
} from "@/lib/referrals/queries"
import { referralLink } from "@/lib/referrals/links"
import { ReferrerToggle } from "@/components/admin/referrer-toggle"
import { ReferralLinkForm } from "@/components/admin/referral-link-form"
import { DeleteReferralLinkButton } from "@/components/admin/delete-referral-link-button"
import {
  LinkTarget,
  ReferralLinkRow,
} from "@/components/referrals/referral-link-row"

/**
 * One partner: the links they hand out, and what has come of them.
 *
 * QRs are rendered here on the server rather than fetched, so the page can be
 * printed straight from the browser — which is how these actually get to a café
 * counter.
 */
export async function ReferrerCard({
  referrer,
  links,
  sessions,
  stats,
}: {
  referrer: Referrer
  links: ReferralLink[]
  sessions: (LinkedSession & { when: string })[]
  stats: ReferrerStats | undefined
}) {
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

      <div className="mt-6">
        <p className="text-xs uppercase tracking-wider text-muted-foreground">
          링크
        </p>
        {links.length === 0 ? (
          <p className="mt-2 text-sm text-muted-foreground">
            아직 만든 링크가 없습니다. 아래에서 대상을 골라 추가하세요.
          </p>
        ) : (
          <ul className="mt-3 space-y-3">
            {links.map((link) => (
              <ReferralLinkRow
                key={link.id}
                link={referralLink(referrer.code, link.path)}
                target={<LinkTarget link={link} />}
                label={link.label}
                actions={<DeleteReferralLinkButton id={link.id} />}
              />
            ))}
          </ul>
        )}

        <div className="mt-4">
          <ReferralLinkForm referrerId={referrer.id} sessions={sessions} />
        </div>
      </div>

      <div className="mt-8 border-t border-border/60 pt-6">
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
            <dd className="mt-0.5 text-muted-foreground">{stats?.lost ?? 0}</dd>
          </div>
        </dl>

        <div className="mt-5">
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

        {stats?.bySession.length ? (
          <div className="mt-5">
            <p className="text-xs uppercase tracking-wider text-muted-foreground">
              예약된 수업
            </p>
            <ul className="mt-1.5 space-y-1">
              {stats.bySession.map((s) => (
                <li key={s.sessionId} className="text-sm text-foreground">
                  <span className="text-muted-foreground">{s.count}건</span>{" "}
                  {s.title}
                  <span className="ml-2 text-xs text-muted-foreground">
                    {s.when}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </div>
    </section>
  )
}
