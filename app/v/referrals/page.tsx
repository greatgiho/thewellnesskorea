import type { Metadata } from "next"
import { requireViewerSession } from "@/lib/auth/require-viewer-session"
import {
  listReferralLinks,
  listReferrers,
  listUpcomingSessions,
  type ReferralSession,
} from "@/lib/referrals/queries"
import { formatSessionWhen, referralLink } from "@/lib/referrals/links"
import { ReferralLinkRow } from "@/components/referrals/referral-link-row"

export const metadata: Metadata = {
  title: "레퍼럴 — The Wellness Korea",
}

/**
 * Who is posting which class, read-only.
 *
 * Read through the request's own client, not the service one: viewers have
 * SELECT policies on referrers, referral_links and sessions, so the database
 * enforces the read-only part rather than this page promising it. That is also
 * why there are no numbers — takings live in bookings and payments, which a
 * viewer has no policy for, and reaching around RLS to print them would undo
 * the point of the role.
 */
export default async function ViewerReferralsPage() {
  const { supabase } = await requireViewerSession()

  const [referrers, links, upcoming] = await Promise.all([
    listReferrers(supabase),
    listReferralLinks(supabase),
    listUpcomingSessions(supabase),
  ])

  const byId = new Map(referrers.map((r) => [r.id, r]))

  const linksBySession = new Map<string, typeof links>()
  const sessions = new Map<string, ReferralSession>()
  for (const s of upcoming) sessions.set(s.id, s)
  for (const link of links) {
    if (!link.sessionId) continue
    const list = linksBySession.get(link.sessionId) ?? []
    list.push(link)
    linksBySession.set(link.sessionId, list)
    if (link.session && !sessions.has(link.session.id)) {
      sessions.set(link.session.id, link.session)
    }
  }

  // Only classes someone is actually posting. A collaborator opening this
  // wants the links to hand out, not the schedule — that is the other tab.
  const ordered = [...sessions.values()]
    .filter((s) => (linksBySession.get(s.id) ?? []).length > 0)
    .sort((a, b) => Date.parse(a.startsAt) - Date.parse(b.startsAt))

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="font-serif text-2xl text-foreground">레퍼럴</h1>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          수업별로 누가 소개하는지와 그 사람 몫의 링크·QR 입니다. 그대로 쓰시면 됩니다.
        </p>
      </div>

      {ordered.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-border px-5 py-8 text-center text-sm text-muted-foreground">
          아직 레퍼럴이 붙은 수업이 없습니다.
        </p>
      ) : (
        ordered.map((session) => (
          <section
            key={session.id}
            className="rounded-3xl border border-border bg-card p-5 sm:p-6"
          >
            <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
              <h2 className="font-serif text-lg text-foreground">
                {session.title}
              </h2>
              <span className="text-sm text-muted-foreground">
                {formatSessionWhen(session.startsAt)}
              </span>
              {session.isCancelled ? (
                <span className="rounded-full bg-destructive/10 px-2 py-0.5 text-xs text-destructive">
                  취소됨
                </span>
              ) : null}
            </div>

            <ul className="mt-4 space-y-3">
              {(linksBySession.get(session.id) ?? []).map((link) => {
                const referrer = byId.get(link.referrerId)
                if (!referrer) return null
                return (
                  <ReferralLinkRow
                    key={link.id}
                    link={referralLink(referrer.code, link.path)}
                    who={
                      <>
                        {referrer.name}
                        <span className="ml-2 font-mono text-xs text-muted-foreground">
                          {referrer.code}
                        </span>
                      </>
                    }
                    label={link.label}
                  />
                )
              })}
            </ul>
          </section>
        ))
      )}
    </div>
  )
}
