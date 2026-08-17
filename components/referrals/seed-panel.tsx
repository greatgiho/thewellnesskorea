import { listReferrers, referralTallies } from "@/lib/referrals/queries"
import { totalsByCode } from "@/lib/referrals/tally"
import { ReferrerCard } from "@/components/referrals/referrer-card"
import { NewReferrerForm } from "@/components/referrals/new-referrer-form"

/**
 * The people and channels who spread a class: a café, an Instagram account,
 * a magazine.
 *
 * Teachers are not here. They have their own tab, because a teacher's code is
 * made from who they already are, while a seed is something someone decided to
 * invent — different act, different screen.
 *
 * This is also the settlement view: one line per seed, everything they brought
 * in across every class. The per-class breakdown is on the booking tab.
 */
export async function SeedPanel() {
  const [referrers, tallies] = await Promise.all([
    listReferrers(),
    referralTallies(),
  ])
  const totals = totalsByCode(tallies)
  const seeds = referrers.filter((r) => !r.partnerId)

  return (
    <section className="rounded-3xl border border-border bg-card p-6 sm:p-8">
      <h2 className="font-serif text-xl text-foreground">바이럴 시드</h2>
      <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
        소개해 줄 사람이나 채널을 여기 등록하면 예약 레퍼럴에서 고를 수 있습니다.
        지우지 않고 비활성으로 둡니다 — 이미 나간 QR 과 지난 정산이 남아야 하니까요.
      </p>

      <div className="mt-6">
        <NewReferrerForm />
      </div>

      {seeds.length > 0 ? (
        <div className="mt-8 space-y-3">
          {seeds.map((r) => (
            <ReferrerCard
              key={r.id}
              referrer={r}
              totals={totals.get(r.code.toLowerCase())}
            />
          ))}
        </div>
      ) : (
        <p className="mt-8 text-sm text-muted-foreground">
          아직 만든 시드가 없습니다.
        </p>
      )}
    </section>
  )
}
