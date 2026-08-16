import type { Metadata } from "next"
import { requireAdminSession } from "@/lib/auth/require-session"
import { listReferrers, referrerStats } from "@/lib/referrals/queries"
import { ReferrerCard } from "@/components/admin/referrer-card"
import { NewReferrerForm } from "@/components/admin/new-referrer-form"

export const metadata: Metadata = {
  title: "레퍼럴 — Admin",
}

export default async function AdminReferralsPage() {
  await requireAdminSession()
  const [referrers, stats] = await Promise.all([listReferrers(), referrerStats()])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-3xl text-foreground">레퍼럴</h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
          링크나 QR 로 들어온 방문자가 예약하면 그 예약에 코드가 기록됩니다.
          기록은 <strong>마지막으로 클릭한 코드 기준, 30일</strong> 입니다.
          정산은 이 숫자를 보고 직접 하시면 됩니다 — 자동 송금은 없습니다.
        </p>
      </div>

      <section className="rounded-3xl border border-border bg-card p-6 sm:p-8">
        <h2 className="font-serif text-xl text-foreground">새 레퍼럴</h2>
        <div className="mt-6">
          <NewReferrerForm />
        </div>
      </section>

      {referrers.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-border px-5 py-8 text-center text-sm text-muted-foreground">
          아직 만든 레퍼럴이 없습니다.
        </p>
      ) : (
        referrers.map((r) => (
          <ReferrerCard
            key={r.id}
            referrer={r}
            stats={stats.get(r.code.toLowerCase())}
          />
        ))
      )}
    </div>
  )
}
