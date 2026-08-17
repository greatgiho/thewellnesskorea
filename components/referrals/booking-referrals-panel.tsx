import {
  listReferralLinks,
  listReferrers,
  listUpcomingSessions,
  referralTallies,
  type ReferralSession,
} from "@/lib/referrals/queries"
import { talliesBySession, type ReferralTally } from "@/lib/referrals/tally"
import { ReferralSessionCard } from "@/components/referrals/referral-session-card"

/**
 * Classes, and who is posting each one.
 *
 * The same component at /a and /v: admins and viewers do the same job here
 * (063), and a second copy is how the two would drift until they disagree
 * about what has been handed out.
 *
 * Reads go through the service client, as the admin screen always has. The
 * takings come from bookings and payments, and giving viewers SELECT on those
 * two tables to render an aggregate would open far more than referrals — the
 * page only ever shows the aggregate. Writes are the opposite: those go
 * through the request's own client, so RLS decides who may make them.
 */
export async function BookingReferralsPanel() {
  const [referrers, links, upcoming, tallies] = await Promise.all([
    listReferrers(),
    listReferralLinks(),
    listUpcomingSessions(),
    referralTallies(),
  ])

  const byId = new Map(referrers.map((r) => [r.id, r]))
  const perSession = talliesBySession(tallies)

  const linksBySession = new Map<string, typeof links>()
  for (const link of links) {
    if (!link.sessionId) continue
    const list = linksBySession.get(link.sessionId) ?? []
    list.push(link)
    linksBySession.set(link.sessionId, list)
  }

  // Upcoming classes, plus any past one someone already has a link for or has
  // already been paid on. A settlement gets read after the class has run, so
  // dropping the past would hide exactly the rows being argued about.
  const sessions = new Map<string, ReferralSession>()
  for (const s of upcoming) sessions.set(s.id, s)
  for (const link of links) {
    if (link.session && !sessions.has(link.session.id)) {
      sessions.set(link.session.id, link.session)
    }
  }

  const now = Date.now()
  const ordered = [...sessions.values()].sort(
    (a, b) => Date.parse(a.startsAt) - Date.parse(b.startsAt),
  )
  const ahead = ordered.filter((s) => Date.parse(s.startsAt) >= now)
  const past = ordered.filter((s) => Date.parse(s.startsAt) < now).reverse()

  const cardFor = (session: ReferralSession) => {
    const own = linksBySession.get(session.id) ?? []
    const taken = new Set(own.map((l) => l.referrerId))
    const codeTallies = new Map<string, ReferralTally>()
    for (const t of perSession.get(session.id) ?? []) codeTallies.set(t.code, t)

    return (
      <ReferralSessionCard
        key={session.id}
        session={session}
        links={own}
        referrers={byId}
        tallies={codeTallies}
        choices={referrers.filter((r) => r.isActive && !taken.has(r.id))}
      />
    )
  }

  return (
    <div className="space-y-6">
      <section className="space-y-4">
        <h2 className="font-serif text-xl text-foreground">다가오는 수업</h2>
        <p className="text-sm text-muted-foreground">
          귀속: 마지막으로 클릭한 코드, 30일.
        </p>
        {ahead.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-border px-5 py-8 text-center text-sm text-muted-foreground">
            예정된 수업이 없습니다.
          </p>
        ) : (
          ahead.map(cardFor)
        )}
      </section>

      {past.length > 0 ? (
        <section className="space-y-4">
          <h2 className="font-serif text-xl text-foreground">지난 수업</h2>
          <p className="text-sm text-muted-foreground">
            레퍼럴이 붙었던 수업만.
          </p>
          {past.map(cardFor)}
        </section>
      ) : null}

    </div>
  )
}
