import { render } from "@react-email/render"
import { BookingConfirmationEmail } from "./emails/booking-confirmation"
import { BookingCancelledEmail } from "./emails/booking-cancelled"
import { WaitlistAvailableEmail } from "./emails/waitlist-available"

export type SessionDetails = {
  sessionTitle: string
  heading: string
  timeRange: string
  floorName: string
  instructorName: string
}

// ---------------------------------------------------------------------------
// Booking Confirmation
// ---------------------------------------------------------------------------

export type BookingConfirmationData = {
  guestName: string
  details: SessionDetails
  ticketUrl: string | null
  cancelUrl: string
  scheduleUrl: string
}

export async function renderBookingConfirmationEmail(
  data: BookingConfirmationData,
): Promise<string> {
  return render(BookingConfirmationEmail(data))
}

// ---------------------------------------------------------------------------
// Booking Cancelled
// ---------------------------------------------------------------------------

export type BookingCancelledData = {
  guestName: string
  details: SessionDetails
  scheduleUrl: string
}

export async function renderBookingCancelledEmail(
  data: BookingCancelledData,
): Promise<string> {
  return render(BookingCancelledEmail(data))
}

// ---------------------------------------------------------------------------
// Waitlist: Spot Available
// ---------------------------------------------------------------------------

export type WaitlistAvailableData = {
  guestName: string
  sessionTitle: string
  heading: string
  timeRange: string
  bookUrl: string
}

export async function renderWaitlistAvailableEmail(
  data: WaitlistAvailableData,
): Promise<string> {
  return render(WaitlistAvailableEmail(data))
}
