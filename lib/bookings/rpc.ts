import { createServiceClient } from "@/lib/supabase/service"
import type { CreateBookingInput, CreateBookingResult } from "./types"

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase()
}

export async function createBookingRpc(
  input: CreateBookingInput,
): Promise<CreateBookingResult> {
  const supabase = createServiceClient()

  const { data, error } = await supabase.rpc("create_booking", {
    p_session_id: input.sessionId,
    p_guest_name: input.guestName.trim(),
    p_guest_email: normalizeEmail(input.guestEmail),
    p_guest_phone: input.guestPhone?.trim() || null,
    p_user_id: input.userId ?? null,
  })

  if (error) {
    throw new Error(error.message)
  }

  const row = Array.isArray(data) ? data[0] : data
  if (!row?.booking_id || !row?.cancel_token) {
    throw new Error("Booking could not be created.")
  }

  return {
    bookingId: row.booking_id,
    cancelToken: row.cancel_token,
  }
}

export async function cancelBookingByTokenRpc(cancelToken: string): Promise<string> {
  const supabase = createServiceClient()

  const { data, error } = await supabase.rpc("cancel_booking_by_token", {
    p_cancel_token: cancelToken.trim(),
  })

  if (error) {
    throw new Error(error.message)
  }

  if (!data) {
    throw new Error("Booking could not be cancelled.")
  }

  return data as string
}

export async function cancelBookingForUserRpc(
  bookingId: string,
  userId: string,
): Promise<string> {
  const supabase = createServiceClient()

  const { data, error } = await supabase.rpc("cancel_booking_for_user", {
    p_booking_id: bookingId,
    p_user_id: userId,
  })

  if (error) {
    throw new Error(error.message)
  }

  if (!data) {
    throw new Error("Booking could not be cancelled.")
  }

  return data as string
}
