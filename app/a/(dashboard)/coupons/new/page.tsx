import type { Metadata } from "next"
import Link from "next/link"
import { requireAdminSession } from "@/lib/auth/require-session"
import { CouponForm } from "@/components/admin/coupon-form"

export const metadata: Metadata = { title: "쿠폰 만들기 — Admin" }

export default async function NewCouponPage() {
  await requireAdminSession()

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/a/coupons"
          className="text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
        >
          ← 쿠폰
        </Link>
        <h1 className="mt-3 font-serif text-3xl text-foreground">쿠폰 만들기</h1>
      </div>
      <CouponForm />
    </div>
  )
}
