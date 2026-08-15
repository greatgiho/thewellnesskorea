import "server-only"

import { createServiceClient } from "@/lib/supabase/service"
import { deploymentOrigin } from "@/lib/site-origin"
import { formatBookingDateTime } from "@/lib/bookings/format"
import { sendEmail } from "@/lib/notifications/email"
import { renderBookingLookupEmail } from "@/lib/notifications/email-templates"

/**
 * "Email me my bookings" — the way back in for someone who booked as a guest.
 *
 * A guest booking lives entirely in its confirmation email: the ticket and the
 * cancel link are both random tokens in a URL, and there is no account to sign
 * into. Delete that email and the booking becomes unreachable, which is fine
 * until the day someone needs to cancel and calls instead.
 *
 * Deliberately says nothing about whether the address is known. The caller
 * shows the same message either way, and this returns nothing that would
 * distinguish the two — otherwise the form becomes a way to ask "did this
 * person book a class here", which is exactly the sort of thing a booking
 * system should not answer.
 */

/** How long an address has to wait before it can ask again. */
const THROTTLE_MINUTES = 10

type BookingRow = {
  id: string
  guest_name: string
  cancel_token: string
  checkin_token: string | null
  session: {
    title: string
    starts_at: string
    ends_at: string
  } | null
}

/**
 * True when this address may be sent to now.
 *
 * Recorded before the lookup rather than after the send, so a burst of
 * requests cannot slip through together while the first one is still reading
 * the database.
 */
async function claimSendSlot(email: string): Promise<boolean> {
  const service = createServiceClient()
  const cutoff = new Date(Date.now() - THROTTLE_MINUTES * 60_000).toISOString()

  const { data: existing } = await service
    .from("booking_lookup_requests")
    .select("requested_at, request_count")
    .eq("email", email)
    .maybeSingle<{ requested_at: string; request_count: number }>()

  if (existing && existing.requested_at > cutoff) {
    // Count the refusal too: repeated blocked attempts are what abuse looks
    // like, and a customer who mistyped once does not generate them.
    await service
      .from("booking_lookup_requests")
      .update({ request_count: existing.request_count + 1 })
      .eq("email", email)
    return false
  }

  await service
    .from("booking_lookup_requests")
    .upsert(
      { email, requested_at: new Date().toISOString(), request_count: 1 },
      { onConflict: "email" },
    )
  return true
}

export async function sendBookingLookupEmail(rawEmail: string): Promise<void> {
  const email = rawEmail.trim().toLowerCase()
  if (!email) return

  if (!(await claimSendSlot(email))) return

  const service = createServiceClient()
  const { data, error } = await service
    .from("bookings")
    .select(
      `id, guest_name, cancel_token, checkin_token,
       session:sessions (title, starts_at, ends_at)`,
    )
    .eq("guest_email", email)
    .eq("status", "confirmed")
    // Past classes have nothing left to do — no ticket to show at a door that
    // has closed, and nothing to cancel.
    .gte("sessions.starts_at", new Date().toISOString())
    .order("id")

  if (error) {
    console.error("[booking-lookup] query failed:", error.message)
    return
  }

  const rows = (data ?? []) as unknown as BookingRow[]
  const bookings = rows
    .filter((row) => row.session)
    .map((row) => {
      const { heading, timeRange } = formatBookingDateTime(
        row.session!.starts_at,
        row.session!.ends_at,
      )
      return {
        sessionTitle: row.session!.title,
        heading,
        timeRange,
        ticketUrl: row.checkin_token
          ? `${deploymentOrigin()}/t/${row.checkin_token}`
          : null,
        cancelUrl: `${deploymentOrigin()}/book/cancel/${row.cancel_token}`,
      }
    })

  // Nothing upcoming: send nothing. Telling an address it has no bookings
  // would confirm the address reached us, and mailing strangers who never
  // booked is how a sending domain gets a reputation.
  if (bookings.length === 0) return

  const html = await renderBookingLookupEmail({
    guestName: rows[0]?.guest_name ?? "",
    bookings,
  })

  await sendEmail(
    email,
    "[TWK] Your upcoming reservations",
    html,
    "booking-lookup",
  )
}
