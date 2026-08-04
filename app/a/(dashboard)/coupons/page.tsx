import type { Metadata } from "next"
import { requireAdminSession } from "@/lib/auth/require-session"
import { getCoupons } from "@/lib/coupons/admin-queries"
import { AdminCouponsList } from "@/components/admin/admin-coupons-list"

export const metadata: Metadata = {
  title: "쿠폰 — Admin",
}

type Props = { searchParams: Promise<{ q?: string }> }

export default async function AdminCouponsPage({ searchParams }: Props) {
  const { supabase } = await requireAdminSession()
  const { q } = await searchParams
  const coupons = await getCoupons(supabase, q)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-3xl text-foreground">쿠폰</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          할인 코드를 발급하고 사용 현황을 확인합니다. 수업에 걸린 할인보다
          불리한 쿠폰은 자동으로 무시되고, 더 유리한 쪽 하나만 적용됩니다.
        </p>
      </div>

      <AdminCouponsList coupons={coupons} initialSearch={q ?? ""} />
    </div>
  )
}
