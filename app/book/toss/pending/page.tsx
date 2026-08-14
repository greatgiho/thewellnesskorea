import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { BookingPageLayout } from "@/components/booking/booking-page-layout"
import { BookingSessionSummary } from "@/components/booking/booking-session-summary"
import { getPendingBookingPayment } from "@/lib/bookings/payment-queries"
import { formatMoney, money } from "@/lib/payments/money"

export const metadata: Metadata = {
  title: "입금 대기 — The Wellness Korea",
}

/**
 * A virtual account has been issued and nothing has been paid into it yet.
 *
 * The seat is held rather than reserved: the ten-minute expiry has been lifted
 * (see applyTossStatus) so the hold survives the walk to a banking app, and the
 * booking becomes real when the deposit arrives by webhook. Saying so plainly
 * matters — this is the one path where the customer leaves with a confirmation
 * page that is not a confirmation.
 */
export default async function TossPendingPage({
  searchParams,
}: {
  searchParams: Promise<{ booking?: string }>
}) {
  const { booking: bookingId } = await searchParams
  if (!bookingId) notFound()

  const pending = await getPendingBookingPayment(bookingId)
  if (!pending) notFound()

  return (
    <BookingPageLayout
      eyebrow="Payment"
      title="입금을 기다리고 있습니다."
      description="가상계좌가 발급되었습니다. 입금이 확인되면 예약이 확정되고 확인 메일을 보내드립니다."
    >
      <div className="space-y-8">
        <BookingSessionSummary summary={pending.summary} />

        <div className="rounded-3xl border border-border bg-card p-6 sm:p-8">
          <p className="font-mono text-xs uppercase tracking-[0.25em] text-muted-foreground">
            입금할 금액
          </p>
          <p className="mt-3 font-serif text-3xl font-light text-foreground">
            {formatMoney(
              money(pending.summary.price.final.currency, pending.amount),
            )}
          </p>
          <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
            계좌번호와 입금 기한은 토스에서 보낸 안내를 확인해 주세요. 입금 전까지
            자리는 예약된 것이 아니라 잡아둔 상태입니다.
          </p>
          <p className="mt-3 text-sm text-muted-foreground">
            주문번호{" "}
            <span className="font-mono text-xs text-foreground">
              {pending.merchantUid}
            </span>
          </p>
        </div>

        <Link
          href="/u/bookings"
          className="inline-flex rounded-full border border-border px-6 py-3 text-sm font-medium text-foreground transition-colors hover:bg-secondary"
        >
          내 예약 보기
        </Link>
      </div>
    </BookingPageLayout>
  )
}
