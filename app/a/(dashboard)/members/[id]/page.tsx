import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { requireAdminSession } from "@/lib/auth/require-session"
import { getAdminMemberDetail } from "@/lib/members/admin-queries"
import { formatBookingDateTime } from "@/lib/bookings/format"
import { formatDateKeyInKst, formatDisplayDate } from "@/lib/schedule/utils"
import { formatMoney, isPaid } from "@/lib/payments/money"
import { MemberAccountStatus } from "@/components/admin/member-account-status"

export const metadata: Metadata = {
  title: "회원 상세 — Admin",
}

type Props = { params: Promise<{ id: string }> }

const BOOKING_STATUS_LABEL: Record<string, string> = {
  confirmed: "확정",
  pending_payment: "결제 대기",
  cancelled: "취소됨",
}

export default async function AdminMemberDetailPage({ params }: Props) {
  const { supabase } = await requireAdminSession()
  const { id } = await params
  const detail = await getAdminMemberDetail(supabase, id)

  if (!detail) notFound()
  const { profile, bookings } = detail

  return (
    <div className="space-y-8">
      <div>
        <Link
          href="/a/members"
          className="text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
        >
          ← 일반회원
        </Link>
        <h1 className="mt-3 font-serif text-3xl text-foreground">
          {profile.name ?? "(이름 없음)"}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {profile.email ?? "이메일 없음"}
        </p>
      </div>

      <section className="rounded-2xl border border-border bg-card p-6">
        <h2 className="font-mono text-xs uppercase tracking-[0.25em] text-muted-foreground">
          프로필
        </h2>
        <dl className="mt-4 grid gap-4 sm:grid-cols-2">
          <div>
            <dt className="text-sm text-muted-foreground">연락처</dt>
            <dd className="mt-0.5 text-sm text-foreground">
              {profile.phone ?? "—"}
            </dd>
          </div>
          <div>
            <dt className="text-sm text-muted-foreground">가입일</dt>
            <dd className="mt-0.5 text-sm text-foreground">
              {formatDisplayDate(formatDateKeyInKst(new Date(profile.createdAt)))}
            </dd>
          </div>
          <div>
            <dt className="text-sm text-muted-foreground">활성 예약</dt>
            <dd className="mt-0.5 text-sm text-foreground">
              {profile.bookingCount}건
            </dd>
          </div>
        </dl>
      </section>

      <MemberAccountStatus memberId={profile.id} banned={profile.banned} />

      <section className="space-y-4">
        <h2 className="font-mono text-xs uppercase tracking-[0.25em] text-muted-foreground">
          예약 · 결제 이력
        </h2>

        {bookings.length === 0 ? (
          <div className="rounded-2xl border border-border bg-card px-6 py-10 text-center">
            <p className="text-sm text-muted-foreground">예약 이력이 없습니다.</p>
          </div>
        ) : (
          <ul className="space-y-3">
            {bookings.map((booking) => {
              const { heading, timeRange } = formatBookingDateTime(
                booking.sessionStartsAt,
                booking.sessionEndsAt,
              )
              return (
                <li
                  key={booking.id}
                  className="rounded-2xl border border-border bg-card p-5"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-medium text-foreground">
                        {booking.sessionTitle}
                      </p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {heading} · {timeRange}
                      </p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {booking.floorName} · {booking.instructorName}
                      </p>
                    </div>
                    <span
                      className={
                        booking.status === "cancelled"
                          ? "shrink-0 rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground"
                          : "shrink-0 rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary"
                      }
                    >
                      {BOOKING_STATUS_LABEL[booking.status] ?? booking.status}
                    </span>
                  </div>

                  <div className="mt-4 border-t border-border pt-3 text-sm">
                    {booking.payment ? (
                      <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1 text-muted-foreground">
                        <span className="text-foreground">
                          {formatMoney(booking.payment.amount)}
                        </span>
                        <span>{booking.payment.status}</span>
                        <span>{booking.payment.provider}</span>
                        <span className="font-mono text-xs">
                          {booking.payment.merchantUid}
                        </span>
                      </div>
                    ) : (
                      <p className="text-muted-foreground">
                        {isPaid(booking.price)
                          ? `현장 결제 · ${formatMoney(booking.price)}`
                          : "무료 클래스"}
                      </p>
                    )}
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </section>
    </div>
  )
}
