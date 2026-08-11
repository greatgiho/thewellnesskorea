import { notFound } from "next/navigation"
import { requireAdminSession } from "@/lib/auth/require-session"
import { getBookingSummaryById } from "@/lib/bookings/queries"
import { renderBookingConfirmationEmail } from "@/lib/notifications/email-templates"
import { getCheckinTokenForBookingId } from "@/lib/bookings/checkin"
import { formatBookingDateTime } from "@/lib/bookings/format"
import Link from "next/link"
import { createServiceClient } from "@/lib/supabase/service"
import { siteOrigin } from "@/lib/site-origin"

/**
 * The confirmation email, rendered in the browser instead of sent.
 *
 * This exists because "is the deployment I am looking at sending the new email
 * or the old one?" turned out to be unanswerable without booking something and
 * waiting for mail — and when the answer was no, it was because the booking had
 * happened on a different deployment than the one being looked at. Two ways to
 * be wrong at once, neither visible.
 *
 * Open it on any deployment and it shows what that deployment would send, no
 * booking and no mail involved. The origin it prints is the one its links are
 * built from, which is the other thing that silently differs per environment.
 *
 * Admin-only, rather than behind ENABLE_DEV_REDESIGN like /dev/redesign. That
 * flag is unset on the preview deployments, which is precisely where this needs
 * to work — the first version of this page 404'd on the one environment it was
 * built to answer questions about. A session is something every environment
 * already has, and it makes the page safe on all of them.
 */
export const dynamic = "force-dynamic"

type Props = { searchParams: Promise<{ booking?: string }> }

export default async function BookingConfirmationEmailPreview({
  searchParams,
}: Props) {
  await requireAdminSession()

  const { booking: bookingId } = await searchParams
  if (!bookingId) {
    // Listed rather than asking for an id. Nobody knows a booking id, and
    // looking one up in the database to see an email is a worse errand than
    // the one this page exists to remove.
    const { data } = await createServiceClient()
      .from("bookings")
      .select("id, guest_name, guest_email, created_at, session:sessions (title)")
      .eq("status", "confirmed")
      .order("created_at", { ascending: false })
      .limit(15)

    const rows = (data ?? []) as unknown as {
      id: string
      guest_name: string
      guest_email: string
      created_at: string
      session: { title: string } | { title: string }[] | null
    }[]

    return (
      <main className="mx-auto max-w-3xl px-6 py-12">
        <h1 className="font-serif text-2xl text-foreground">
          Booking confirmation email
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Links built against <code className="text-foreground">{siteOrigin()}</code>
        </p>
        <ul className="mt-8 divide-y divide-border border-y border-border">
          {rows.map((b) => {
            const session = Array.isArray(b.session) ? b.session[0] : b.session
            return (
              <li key={b.id}>
                <Link
                  href={`/dev/emails/booking-confirmation?booking=${b.id}`}
                  className="block py-3 transition-colors hover:bg-secondary/40"
                >
                  <span className="text-sm text-foreground">
                    {b.guest_name} · {session?.title ?? "—"}
                  </span>
                  <span className="ml-2 text-xs text-muted-foreground">
                    {b.guest_email} · {b.created_at.slice(0, 16).replace("T", " ")}
                  </span>
                </Link>
              </li>
            )
          })}
        </ul>
      </main>
    )
  }

  const summary = await getBookingSummaryById(bookingId)
  if (!summary) notFound()

  const checkinToken = await getCheckinTokenForBookingId(bookingId)
  const { heading, timeRange } = formatBookingDateTime(
    summary.sessionStartsAt,
    summary.sessionEndsAt,
  )

  const html = await renderBookingConfirmationEmail({
    guestName: summary.guestName,
    details: {
      sessionTitle: summary.sessionTitle,
      heading,
      timeRange,
      floorName: summary.floorName,
      instructorName: summary.instructorName,
    },
    ticketUrl: checkinToken ? `${siteOrigin()}/t/${checkinToken}` : null,
    cancelUrl: `${siteOrigin()}/book/cancel/CANCEL_TOKEN`,
    scheduleUrl: `${siteOrigin()}/#upcoming`,
  })

  return (
    <main className="mx-auto max-w-3xl px-6 py-10">
      <h1 className="font-serif text-2xl text-foreground">
        Booking confirmation email
      </h1>
      <dl className="mt-4 space-y-1 text-sm text-muted-foreground">
        <div>
          origin <code className="text-foreground">{siteOrigin()}</code>
        </div>
        <div>
          ticket{" "}
          <code className="text-foreground">
            {checkinToken ? `/t/${checkinToken}` : "none — no checkin_token"}
          </code>
        </div>
      </dl>
      {/* The email as the recipient's client would receive it. */}
      <iframe
        title="Rendered email"
        srcDoc={html}
        className="mt-6 h-[900px] w-full rounded-2xl border border-border bg-white"
      />
    </main>
  )
}
