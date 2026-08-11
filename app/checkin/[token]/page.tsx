import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { CheckInPanel } from "@/components/booking/check-in-panel"
import { TicketDetails } from "@/components/booking/ticket-details"
import { getStaffSession } from "@/lib/auth/require-staff-session"
import { getTicketByToken } from "@/lib/bookings/checkin"

export const metadata: Metadata = {
  title: "Check in — The Wellness Korea",
  robots: { index: false, follow: false },
}

// Never cached: this page's whole job is to report whether a ticket has been
// used yet, and two staff phones may be looking at the same one.
export const dynamic = "force-dynamic"

type CheckInPageProps = {
  params: Promise<{ token: string }>
}

/**
 * Where a scanned ticket lands.
 *
 * Deliberately not inside the public site chrome or either dashboard: it is
 * opened by pointing a phone camera at a QR code, one booking at a time, often
 * by someone standing at a door. A nav bar and a footer are noise there.
 *
 * The authorization that matters is not here. Anyone signed in as staff can
 * open this page and read the ticket; whether they may admit this particular
 * booking is decided by can_check_in_session in the database when the button is
 * pressed, so a partner cannot check in another partner's class by opening its
 * link.
 */
export default async function CheckInPage({ params }: CheckInPageProps) {
  const { token } = await params
  const [ticket, staff] = await Promise.all([
    getTicketByToken(token),
    getStaffSession(),
  ])

  if (!ticket) notFound()

  return (
    <main className="mx-auto min-h-screen w-full max-w-md px-6 py-12">
      <p className="text-sm uppercase tracking-[0.2em] text-primary">Check in</p>
      <h1 className="mt-3 font-serif text-3xl leading-tight text-foreground">
        {staff ? "Admit this guest?" : "Staff sign-in required"}
      </h1>

      {staff ? (
        <div className="mt-8">
          <CheckInPanel token={token} ticket={ticket} />
        </div>
      ) : (
        <div className="mt-8 space-y-6">
          {/* Details are shown before signing in on purpose: it tells whoever
              scanned an unfamiliar code what it was, and it is no more than the
              guest's own ticket already shows to anyone they hold it up to. */}
          <div className="rounded-3xl border border-border bg-card p-6">
            <TicketDetails ticket={ticket} />
          </div>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/a/signin"
              className="inline-flex rounded-full bg-primary px-6 py-3 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
            >
              Admin sign in
            </Link>
            <Link
              href="/p/signin"
              className="inline-flex rounded-full border border-border px-6 py-3 text-sm font-medium text-foreground transition-colors hover:bg-secondary"
            >
              Partner sign in
            </Link>
          </div>
        </div>
      )}
    </main>
  )
}
