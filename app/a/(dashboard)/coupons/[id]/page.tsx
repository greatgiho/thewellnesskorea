import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { requireAdminSession } from "@/lib/auth/require-session"
import { getCoupon, getCouponRedemptions } from "@/lib/coupons/admin-queries"
import { formatMoney, money } from "@/lib/payments/money"
import { formatDateKeyInKst, formatDisplayDate } from "@/lib/schedule/utils"
import { CouponForm } from "@/components/admin/coupon-form"
import { CouponActiveToggle } from "@/components/admin/coupon-active-toggle"

export const metadata: Metadata = { title: "쿠폰 상세 — Admin" }

type Props = { params: Promise<{ id: string }> }

export default async function CouponDetailPage({ params }: Props) {
  const { supabase } = await requireAdminSession()
  const { id } = await params

  const coupon = await getCoupon(supabase, id)
  if (!coupon) notFound()

  const redemptions = await getCouponRedemptions(supabase, id)

  // Cancelled bookings release their redemption, so anything still listed is
  // a live use. Group the total by class currency — a percentage coupon can
  // be spent on both a USD and a KRW class.
  const totals = new Map<string, number>()
  for (const r of redemptions) {
    const key = r.currency ?? "USD"
    totals.set(key, (totals.get(key) ?? 0) + r.amountDiscounted)
  }

  return (
    <div className="space-y-8">
      <div>
        <Link
          href="/a/coupons"
          className="text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
        >
          ← 쿠폰
        </Link>
        <h1 className="mt-3 font-mono text-3xl text-foreground">{coupon.code}</h1>
        {coupon.note ? (
          <p className="mt-2 text-sm text-muted-foreground">{coupon.note}</p>
        ) : null}
      </div>

      <section className="rounded-2xl border border-border bg-card p-6">
        <h2 className="font-mono text-xs uppercase tracking-[0.25em] text-muted-foreground">
          사용 현황
        </h2>
        <dl className="mt-4 grid gap-4 sm:grid-cols-3">
          <div>
            <dt className="text-sm text-muted-foreground">사용 횟수</dt>
            <dd className="mt-0.5 text-sm text-foreground">
              {redemptions.length}
              {coupon.maxRedemptions != null ? ` / ${coupon.maxRedemptions}` : " (무제한)"}
            </dd>
          </div>
          <div>
            <dt className="text-sm text-muted-foreground">총 할인액</dt>
            <dd className="mt-0.5 text-sm text-foreground">
              {totals.size === 0
                ? "—"
                : [...totals.entries()]
                    .map(([c, a]) => formatMoney(money(c, a)))
                    .join(" · ")}
            </dd>
          </div>
          <div>
            <dt className="text-sm text-muted-foreground">1인 한도</dt>
            <dd className="mt-0.5 text-sm text-foreground">
              {coupon.maxPerUser != null ? `${coupon.maxPerUser}회` : "무제한"}
            </dd>
          </div>
        </dl>
      </section>

      <CouponActiveToggle couponId={coupon.id} isActive={coupon.isActive} />

      <section className="space-y-4">
        <h2 className="font-mono text-xs uppercase tracking-[0.25em] text-muted-foreground">
          설정
        </h2>
        <CouponForm coupon={coupon} />
      </section>

      <section className="space-y-4">
        <h2 className="font-mono text-xs uppercase tracking-[0.25em] text-muted-foreground">
          사용 이력
        </h2>
        {redemptions.length === 0 ? (
          <div className="rounded-2xl border border-border bg-card px-6 py-10 text-center">
            <p className="text-sm text-muted-foreground">
              아직 사용된 적이 없습니다. 예약이 취소되면 사용 기록도 함께
              해제되므로, 여기 남은 건 모두 유효한 사용입니다.
            </p>
          </div>
        ) : (
          <div className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
            <div className="min-w-[640px] overflow-hidden rounded-2xl border border-border">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-border bg-secondary/50 text-xs uppercase tracking-wider text-muted-foreground">
                  <tr>
                    <th className="px-4 py-3 font-medium">사용자</th>
                    <th className="px-4 py-3 font-medium">수업</th>
                    <th className="px-4 py-3 font-medium">할인액</th>
                    <th className="px-4 py-3 font-medium">일시</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {redemptions.map((r) => (
                    <tr key={r.id} className="bg-card">
                      <td className="px-4 py-3 text-foreground">{r.email}</td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {r.sessionTitle ?? "—"}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {formatMoney(money(r.currency ?? "USD", r.amountDiscounted))}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {formatDisplayDate(formatDateKeyInKst(new Date(r.createdAt)))}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </section>
    </div>
  )
}
