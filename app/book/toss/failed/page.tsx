import type { Metadata } from "next"
import Link from "next/link"
import { BookingPageLayout } from "@/components/booking/booking-page-layout"

export const metadata: Metadata = {
  title: "Payment failed — The Wellness Korea",
}

/**
 * Reached two ways: Toss's own failUrl when the customer cancels or the card
 * is declined, and our success handler when the confirm did not go through.
 *
 * The hold is still standing either way — nothing was charged and the seat has
 * not been released — so the useful thing to offer is the way back to the
 * payment screen rather than an apology.
 */
export default async function TossFailPage({
  searchParams,
}: {
  searchParams: Promise<{ message?: string; code?: string; booking?: string }>
}) {
  const { message, code, booking } = await searchParams

  return (
    <BookingPageLayout
      eyebrow="Payment"
      title="결제가 완료되지 않았습니다."
      description="아직 결제된 금액은 없습니다. 예약은 잠시 더 유지되니 다시 시도하실 수 있습니다."
    >
      <div className="space-y-8">
        {message ? (
          <div className="rounded-2xl border border-border bg-card px-5 py-4">
            <p className="text-sm text-foreground">{message}</p>
            {code ? (
              <p className="mt-2 font-mono text-xs text-muted-foreground">
                {code}
              </p>
            ) : null}
          </div>
        ) : null}

        <div className="flex flex-wrap gap-3">
          {booking ? (
            <Link
              href={`/book/pay?booking=${booking}`}
              className="inline-flex rounded-full bg-primary px-6 py-3 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
            >
              다시 결제하기
            </Link>
          ) : null}
          <Link
            href="/#upcoming"
            className="inline-flex rounded-full border border-border px-6 py-3 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary"
          >
            수업 목록으로
          </Link>
        </div>
      </div>
    </BookingPageLayout>
  )
}
