import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { ChevronLeft } from "lucide-react"
import { requireAdminSession } from "@/lib/auth/require-session"
import { getSessionById } from "@/lib/schedule/queries"
import { getBookingsForSessionAdmin } from "@/lib/bookings/admin-queries"
import { getWaitlistForSession } from "@/lib/waitlist/admin-queries"
import { formatBookingDateTime } from "@/lib/bookings/format"
import { formatKrw } from "@/lib/bookings/format"
import { sessionStatusLabel } from "@/lib/schedule/session-status"
import { SessionBookingDetail } from "@/components/admin/session-booking-detail"

type Props = {
  params: Promise<{ sessionId: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { sessionId } = await params
  const session = await getSessionById(sessionId)
  return {
    title: session ? `${session.title} — Bookings Admin` : "Session — Bookings Admin",
  }
}

export default async function AdminSessionBookingsPage({ params }: Props) {
  const { sessionId } = await params
  const { supabase } = await requireAdminSession()

  const [session, bookings, waitlist] = await Promise.all([
    getSessionById(sessionId),
    getBookingsForSessionAdmin(supabase, sessionId),
    getWaitlistForSession(sessionId),
  ])

  if (!session) notFound()

  const { heading, timeRange } = formatBookingDateTime(
    session.starts_at,
    session.ends_at,
  )

  const isPaid = (session.price_krw ?? 0) > 0

  return (
    <div className="space-y-8">
      {/* ── Breadcrumb ── */}
      <div>
        <Link
          href="/admin/bookings"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ChevronLeft className="size-4" />
          Back to Bookings
        </Link>
      </div>

      {/* ── Session info (read-only) ── */}
      <section className="rounded-2xl border border-border bg-card p-6 space-y-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
              Class
            </p>
            <h1 className="mt-1 font-serif text-2xl text-foreground">{session.title}</h1>
          </div>
          <span className="rounded-full border border-border px-3 py-1 text-xs font-medium text-muted-foreground">
            {sessionStatusLabel(session.status)}
            {session.is_published ? " · Published" : " · Unpublished"}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-x-8 gap-y-3 text-sm sm:grid-cols-3">
          <div>
            <p className="text-xs text-muted-foreground">Date</p>
            <p className="mt-0.5 font-medium text-foreground">{heading}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Time</p>
            <p className="mt-0.5 font-medium text-foreground">{timeRange}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Floor</p>
            <p className="mt-0.5 font-medium text-foreground">
              {session.floor?.name_en ?? "—"}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Instructor</p>
            <p className="mt-0.5 font-medium text-foreground">
              {session.instructor?.name_en ?? "—"}
              {session.instructor?.name_ko
                ? ` · ${session.instructor.name_ko}`
                : ""}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Capacity</p>
            <p className="mt-0.5 font-medium text-foreground">
              {session.booked_count} / {session.capacity}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Price</p>
            <p className="mt-0.5 font-medium text-foreground">
              {isPaid ? formatKrw(session.price_krw ?? 0) : "Free (on-site)"}
            </p>
          </div>
        </div>
      </section>

      {/* ── Bookings + Waitlist ── */}
      <SessionBookingDetail
        sessionId={sessionId}
        capacity={session.capacity}
        bookings={bookings}
        waitlist={waitlist}
      />
    </div>
  )
}
