export type BookingStatus = "confirmed" | "cancelled" | "no_show" | "pending_payment"

export type PaymentStatus = "pending" | "paid" | "failed" | "cancelled"

export type BookingRow = {
  id: string
  session_id: string
  user_id: string | null
  guest_name: string
  guest_email: string
  guest_phone: string | null
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
