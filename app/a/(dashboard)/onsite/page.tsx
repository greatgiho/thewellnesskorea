import type { Metadata } from "next"
import Link from "next/link"
import { requireAdminSession } from "@/lib/auth/require-session"
import { getSellableSessions } from "@/lib/schedule/queries"
import {
  SessionQrFigure,
  sessionQrBlocker,
  type SessionQrSubject,
} from "@/components/admin/session-booking-qr"
import { formatBookingDateTime } from "@/lib/bookings/format"
import { formatMoney, money } from "@/lib/payments/money"

export const metadata: Metadata = {
  title: "현장 결제 — Admin",
}

// Which classes are still to come changes with the clock, and a class that
// has started must stop being offered. Cached, this screen would keep selling
// it.
export const dynamic = "force-dynamic"

/**
 * The screen for whoever is standing at the door.
 *
 * The QR for a class already exists on that class's own page, but getting
 * there is: sign in, 결제, pick a date range, find the class, scroll. That is
 * not a thing to do with somebody waiting in front of you. This is the same
 * QRs, one screen, opened once at the start of a shift.
 *
 * Every QR is drawn, not hidden behind a tap. Each costs about 3ms to render
 * and the whole point is that nothing stands between a question and an answer.
 *
 * Classes that cannot be sold from a QR are still listed, with the reason —
 * mostly won pricing while Toss is suspended. Leaving them out would make the
 * screen quietly disagree with the schedule, and someone would go looking for
 * a class that is running.
 */
export default async function AdminOnsitePage() {
  const { supabase } = await requireAdminSession()
  const sessions = await getSellableSessions(supabase)

  return (
    <div className="space-y-6">
      <h1 className="font-serif text-3xl text-foreground">현장 결제</h1>

      {sessions.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-border px-4 py-6 text-center text-sm text-muted-foreground">
          예정된 수업이 없습니다.
        </p>
      ) : (
        <div className="space-y-4">
          {sessions.map((session) => {
            const price = money(session.price_currency, session.price_amount)
            const subject: SessionQrSubject = {
              id: session.id,
              title: session.title,
              status: session.status,
              isPublished: session.is_published,
              startsAt: session.starts_at,
              currency: price.currency,
              amount: price.amount,
            }
            const when = formatBookingDateTime(session.starts_at, session.ends_at)
            const seatsLeft = Math.max(
              0,
              session.capacity - (session.booked_count ?? 0),
            )

            return (
              <section
                key={session.id}
                className="rounded-2xl border border-border bg-card p-6"
              >
                <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                  <Link
                    href={`/a/bookings/sessions/${session.id}`}
                    className="font-serif text-xl text-foreground hover:underline"
                  >
                    {session.title}
                  </Link>
                  <p className="text-sm text-muted-foreground">
                    {when.heading} · {when.timeRange}
                  </p>
                </div>
                <p className="mt-1 text-sm text-muted-foreground">
                  {formatMoney(price)} · 남은 자리 {seatsLeft}
                  {sessionQrBlocker(subject) ? null : " · 스캔하면 예약과 결제가 함께 됩니다"}
                </p>

                <div className="mt-5">
                  <SessionQrFigure session={subject} />
                </div>
              </section>
            )
          })}
        </div>
      )}
    </div>
  )
}
