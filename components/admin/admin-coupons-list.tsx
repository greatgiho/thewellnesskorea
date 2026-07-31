"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Search } from "lucide-react"
import { cn } from "@/lib/utils"
import { FIELD } from "@/lib/ui/field"
import { formatMoney } from "@/lib/payments/money"
import { formatDateKeyInKst } from "@/lib/schedule/utils"
import type { CouponWithUsage } from "@/lib/coupons/admin-queries"

type Props = {
  coupons: CouponWithUsage[]
  initialSearch: string
}

/** "무기한" beats an empty cell — a blank date reads as missing data. */
function windowLabel(startsAt: string | null, endsAt: string | null): string {
  if (!startsAt && !endsAt) return "무기한"
  const from = startsAt ? formatDateKeyInKst(new Date(startsAt)) : "—"
  const to = endsAt ? formatDateKeyInKst(new Date(endsAt)) : "—"
  return `${from} ~ ${to}`
}

function valueLabel(c: CouponWithUsage): string {
  return c.discountType === "percent"
    ? `${c.discountValue}%`
    : formatMoney({ currency: (c.currency ?? "USD") as "KRW" | "USD", amount: c.discountValue })
}

export function AdminCouponsList({ coupons, initialSearch }: Props) {
  const router = useRouter()
  const [search, setSearch] = useState(initialSearch)

  const submit = () => {
    const q = search.trim()
    router.push(q ? `/a/coupons?q=${encodeURIComponent(q)}` : "/a/coupons")
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-[220px] flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && submit()}
            placeholder="코드 · 메모 검색"
            className={cn(FIELD, "pl-9")}
          />
        </div>
        <Link
          href="/a/coupons/new"
          className="h-11 shrink-0 rounded-lg bg-primary px-4 text-sm font-medium leading-[2.75rem] text-primary-foreground transition-colors hover:bg-primary/90 sm:h-9 sm:leading-9"
        >
          쿠폰 만들기
        </Link>
      </div>

      <p className="text-sm text-muted-foreground">
        {initialSearch
          ? `"${initialSearch}" 검색 결과 ${coupons.length}건`
          : `총 ${coupons.length}건`}
      </p>

      {coupons.length === 0 ? (
        <div className="rounded-2xl border border-border bg-card px-6 py-10 text-center">
          <p className="text-sm text-muted-foreground">
            {initialSearch ? "검색 결과가 없습니다." : "아직 발급한 쿠폰이 없습니다."}
          </p>
        </div>
      ) : (
        <div className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
          <div className="min-w-[760px] overflow-hidden rounded-2xl border border-border">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-border bg-secondary/50 text-xs uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 font-medium">코드</th>
                  <th className="px-4 py-3 font-medium">할인</th>
                  <th className="px-4 py-3 font-medium">기간</th>
                  <th className="px-4 py-3 font-medium">사용</th>
                  <th className="px-4 py-3 font-medium">총 할인액</th>
                  <th className="px-4 py-3 font-medium">상태</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {coupons.map((c) => (
                  <tr key={c.id} className="bg-card transition-colors hover:bg-muted/40">
                    <td className="px-4 py-3">
                      <Link
                        href={`/a/coupons/${c.id}`}
                        className="font-mono font-medium text-foreground underline-offset-4 hover:underline"
                      >
                        {c.code}
                      </Link>
                      {c.note ? (
                        <p className="mt-0.5 text-xs text-muted-foreground">{c.note}</p>
                      ) : null}
                    </td>
                    <td className="px-4 py-3 text-foreground">{valueLabel(c)}</td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {windowLabel(c.startsAt, c.endsAt)}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {c.redemptions}
                      {c.maxRedemptions != null ? ` / ${c.maxRedemptions}` : ""}
                      {c.maxPerUser != null ? ` (1인 ${c.maxPerUser})` : ""}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {c.totalDiscounted.length === 0
                        ? "—"
                        : c.totalDiscounted.map((m) => formatMoney(m)).join(" · ")}
                    </td>
                    <td className="px-4 py-3">
                      {c.isActive ? (
                        <span className="text-xs text-muted-foreground">활성</span>
                      ) : (
                        <span className="rounded-full bg-destructive/10 px-2 py-0.5 text-xs font-medium text-destructive">
                          중단됨
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
