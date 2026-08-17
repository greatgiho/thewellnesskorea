import {
  listReferralLinks,
  listReferrers,
  listUpcomingSessions,
  referralTallies,
  type ReferralSession,
} from "@/lib/referrals/queries"
import {
  talliesBySession,
  totalsByCode,
  type ReferralTally,
} from "@/lib/referrals/tally"
import { ReferralSessionCard } from "@/components/referrals/referral-session-card"
import { ReferrerCard } from "@/components/referrals/referrer-card"
import { NewReferrerForm } from "@/components/referrals/new-referrer-form"

/**
 * The referral screen, rendered identically at /a/referrals and /v/referrals.
 *
 * One component rather than two pages that look alike: admins and viewers do
 * the same job here (063), and a second copy is how the two would drift until
 * they disagree about what has been handed out.
 *
 * Reads go through the service client, as the admin screen always has. The
 * takings come from bookings and payments, and giving viewers SELECT on those
 * two tables to render an aggregate would open far more than referrals — the
 * page only ever shows the aggregate. Writes are the opposite: those go
 * through the request's own client, so RLS decides who may make them.
 */
export async function ReferralScreen() {
  const [referrers, links, upcoming, tallies] = await Promise.all([
    listReferrers(),
    listReferralLinks(),
    listUpcomingSessions(),
    referralTallies(),
  ])

  const byId = new Map(referrers.map((r) => [r.id, r]))
  const totals = totalsByCode(tallies)
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
      <div>
        <h1 className="font-serif text-3xl text-foreground">레퍼럴</h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
          수업마다 소개할 사람을 정하면 그 사람 몫의 예약 링크와 QR 이 만들어집니다.
          그 링크로 들어온 방문자가 예약하면 예약에 코드가 남고, 아래 숫자로 잡힙니다.
          귀속은 <strong>마지막으로 클릭한 코드 기준, 30일</strong>. 자동 송금은 없습니다.
        </p>
      </div>

      <section className="space-y-4">
        <h2 className="font-serif text-xl text-foreground">다가오는 수업</h2>
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
            레퍼럴이 붙었던 수업만 보입니다. 정산 확인용입니다.
          </p>
          {past.map(cardFor)}
        </section>
      ) : null}

      <section className="rounded-3xl border border-border bg-card p-6 sm:p-8">
        <h2 className="font-serif text-xl text-foreground">레퍼럴 대상</h2>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
          소개해 줄 사람이나 채널을 먼저 여기 등록하면, 위 수업에서 고를 수 있습니다.
          지우지 않고 비활성으로 둡니다 — 이미 나간 링크와 지난 정산이 남아야 하니까요.
        </p>

        <div className="mt-6">
          <NewReferrerForm />
        </div>

        {referrers.length > 0 ? (
          <div className="mt-8 space-y-3">
            {referrers.map((r) => (
              <ReferrerCard
                key={r.id}
                referrer={r}
                totals={totals.get(r.code.toLowerCase())}
              />
            ))}
          </div>
        ) : null}
      </section>
    </div>
  )
}
