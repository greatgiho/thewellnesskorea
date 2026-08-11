import QRCode from "qrcode"
import { createServiceClient } from "@/lib/supabase/service"
import { deploymentOrigin } from "@/lib/site-origin"
import type { BookingStatus } from "./types"

/**
 * A ticket, as the holder and the door both see it.
 *
 * Reachable from a token alone, so it carries nothing that is not already on
 * the confirmation email. Notably no booking id, no email address, and no
 * price — a ticket gets held up to strangers.
 */
export type TicketSummary = {
  guestName: string
  adultCount: number
  childCount: number
  /** People this one QR admits. The number the door actually acts on. */
  partySize: number
  status: BookingStatus
  sessionTitle: string
  sessionStartsAt: string
  sessionEndsAt: string
  floorName: string
  instructorName: string
  checkedInAt: string | null
}

const TICKET_SELECT = `
  guest_name,
  adult_count,
  child_count,
  status,
  checked_in_at,
  session:sessions (
    title,
    starts_at,
    ends_at,
    floor:floors (name_ko, name_en),
    instructor:partners (name_ko, name_en)
  )
`

type TicketRow = {
  guest_name: string
  adult_count: number
  child_count: number
  status: BookingStatus
  checked_in_at: string | null
  session:
    | {
        title: string
        starts_at: string
        ends_at: string
        floor: { name_ko: string | null; name_en: string | null } | null
        instructor: { name_ko: string | null; name_en: string | null } | null
      }
    | null
}

function one<T>(value: T | T[] | null): T | null {
  if (!value) return null
  return Array.isArray(value) ? (value[0] ?? null) : value
}

function toTicket(row: TicketRow): TicketSummary | null {
  const session = one(row.session)
  if (!session) return null
  const floor = one(session.floor)
  const instructor = one(session.instructor)
  return {
    guestName: row.guest_name,
    adultCount: row.adult_count,
    childCount: row.child_count,
    partySize: row.adult_count + row.child_count,
    status: row.status,
    sessionTitle: session.title,
    sessionStartsAt: session.starts_at,
    sessionEndsAt: session.ends_at,
    floorName: floor?.name_ko ?? floor?.name_en ?? "",
    instructorName: instructor?.name_ko ?? instructor?.name_en ?? "",
    checkedInAt: row.checked_in_at,
  }
}

/**
 * The ticket behind a token.
 *
 * Read with the service client on purpose. The holder is usually not signed in
 * — most bookings are guest bookings — so there is no session for RLS to work
 * from, and the token is the credential. Same reasoning as the cancel-by-token
 * page, and the reason this returns a narrow shape rather than the row.
 */
export async function getTicketByToken(
  token: string,
): Promise<TicketSummary | null> {
  if (!token) return null
  const service = createServiceClient()
  const { data, error } = await service
    .from("bookings")
    .select(TICKET_SELECT)
    .eq("checkin_token", token)
    .maybeSingle()

  if (error || !data) return null
  return toTicket(data as unknown as TicketRow)
}

/** Where a scanned ticket sends whoever is holding the camera. */
export function checkInUrl(token: string): string {
  return `${deploymentOrigin()}/checkin/${token}`
}

/** Where the holder reads their own ticket. */
export function ticketUrl(token: string): string {
  return `${deploymentOrigin()}/t/${token}`
}

/**
 * The ticket QR, as an inline SVG string.
 *
 * Rendered on the server so no QR library reaches the browser, and as SVG so it
 * stays sharp on the screen it will actually be scanned from. It encodes the
 * check-in URL rather than the bare token: a phone's own camera app then offers
 * to open it, which is the whole reason staff need no scanner app.
 */
export async function ticketQrSvg(token: string): Promise<string> {
  return QRCode.toString(checkInUrl(token), {
    type: "svg",
    margin: 1,
    errorCorrectionLevel: "M",
  })
}

/**
 * The ticket token for a booking id.
 *
 * Service client, for the same reason getTicketByToken uses one: the callers
 * are the confirmation screen and the confirmation email, and a guest booking
 * has no session for RLS to work from. The confirmation screen already renders
 * the whole booking from a booking id in the URL through the service client
 * (getBookingSummaryById), so this exposes nothing that page did not already.
 */
export async function getCheckinTokenForBookingId(
  bookingId: string,
): Promise<string | null> {
  const { data, error } = await createServiceClient()
    .from("bookings")
    .select("checkin_token")
    .eq("id", bookingId)
    .maybeSingle()

  if (error || !data) return null
  return (data as { checkin_token: string }).checkin_token
}
