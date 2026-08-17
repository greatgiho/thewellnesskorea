import type { Metadata } from "next"
import { requireViewerSession } from "@/lib/auth/require-viewer-session"
import { listReferralLinks, listReferrers } from "@/lib/referrals/queries"
import { referralLink } from "@/lib/referrals/links"
import {
  LinkTarget,
  ReferralLinkRow,
} from "@/components/referrals/referral-link-row"

export const metadata: Metadata = {
  title: "레퍼럴 — The Wellness Korea",
}

/**
 * The referral list, read-only.
 *
 * Read through the request's own client, not the service one: viewers have
 * SELECT policies on both tables (062), so the database enforces the read-only
 * part rather than this page promising it. That is also why there are no
 * numbers here — takings live in bookings and payments, which a viewer has no
 * policy for, and reaching around RLS to print them would undo the point of
 * the role.
 */
export default async function ViewerReferralsPage() {
  const { supabase } = await requireViewerSession()

  const [referrers, links] = await Promise.all([
    listReferrers(supabase),
    listReferralLinks(supabase),
  ])

  const linksByReferrer = new Map<string, typeof links>()
  for (const link of links) {
    const list = linksByReferrer.get(link.referrerId) ?? []
    list.push(link)
    linksByReferrer.set(link.referrerId, list)
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="font-serif text-2xl text-foreground">레퍼럴</h1>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          파트너별 예약 링크와 QR 입니다. 그대로 인쇄해서 쓰시면 됩니다.
        </p>
      </div>

      {referrers.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-border px-5 py-8 text-center text-sm text-muted-foreground">
          아직 만든 레퍼럴이 없습니다.
        </p>
      ) : (
        referrers.map((referrer) => {
          const own = linksByReferrer.get(referrer.id) ?? []
          return (
            <section
              key={referrer.id}
              className={`rounded-3xl border p-5 sm:p-6 ${
                referrer.isActive
                  ? "border-border bg-card"
                  : "border-dashed border-border bg-muted/30"
              }`}
            >
              <h2 className="font-serif text-lg text-foreground">
                {referrer.name}
                {!referrer.isActive ? (
                  <span className="ml-2 align-middle text-xs text-muted-foreground">
                    비활성
                  </span>
                ) : null}
              </h2>
              <p className="mt-1 font-mono text-xs text-muted-foreground">
                {referrer.code}
              </p>

              {own.length === 0 ? (
                <p className="mt-4 text-sm text-muted-foreground">
                  아직 만든 링크가 없습니다.
                </p>
              ) : (
                <ul className="mt-4 space-y-3">
                  {own.map((link) => (
                    <ReferralLinkRow
                      key={link.id}
                      link={referralLink(referrer.code, link.path)}
                      target={<LinkTarget link={link} />}
                      label={link.label}
                    />
                  ))}
                </ul>
              )}
            </section>
          )
        })
      )}
    </div>
  )
}
