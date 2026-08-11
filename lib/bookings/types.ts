import type { AttendeeType } from "@/lib/payments/money"

// Which rate a booking was sold at lives with money because that is what
// decides the price, but it reads as a booking fact everywhere it is used.
export type { AttendeeType }

export type BookingStatus = "confirmed" | "cancelled" | "no_show" | "pending_payment"

export type PaymentStatus = "pending" | "paid" | "failed" | "cancelled"

export type BookingRow = {
  id: string
  session_id: string
  user_id: string | null
  guest_name: string
  guest_email: string
  guest_phone: string | null
  attendee_type: AttendeeType
  status: BookingStatus
  cancelled_at: string | null
  cancel_token: string
  expires_at: string | null
  created_at: string
  updated_at: string
}

export type MemberRow = {
  id: string
  name: string | null
  phone: string | null
  locale: string | null
  created_at: string
  updated_at: string
}

export type CreateBookingInput = {
  sessionId: string
  guestName: string
  guestEmail: string
  guestPhone?: string | null
  userId?: string | null
  /** Raw code from the form; validated server-side inside the booking txn. */
  couponCode?: string | null
  /**
   * Which rate to book at. Only the rate is sent — the price it implies is
   * computed inside the booking transaction, never taken from the client.
   */
  attendeeType?: AttendeeType
}

export type CreateBookingResult = {
  bookingId: string
  cancelToken: string
}

export type CreateBookingHoldInput = CreateBookingInput & {
  pgProvider?: string
  holdMinutes?: number
}

export type CreateBookingHoldResult = {
  bookingId: string
  cancelToken: string
  merchantUid: string
  amount: number
  expiresAt: string
}
