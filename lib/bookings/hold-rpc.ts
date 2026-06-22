import { createServiceClient } from "@/lib/supabase/service"
import type { CreateBookingHoldInput, CreateBookingHoldResult } from "./types"

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase()
}

export async function createBookingHoldRpc(
  input: CreateBookingHoldInput,
): Promise<CreateBookingHoldResult> {
  const supabase = createServiceClient()

  const { data, error } = await supabase.rpc("create_booking_hold", {
    p_session_id: input.sessionId,
    p_guest_name: input.guestName.trim(),
    p_guest_email: normalizeEmail(input.guestEmail),
    p_guest_phone: input.guestPhone?.trim() || null,
    p_user_id: input.userId ?? null,
    p_pg_provider: input.pgProvider ?? "portone",
    p_hold_minutes: input.holdMinutes ?? 10,
  })

  if (error) {
    throw new Error(error.message)
  }

  const row = Array.isArray(data) ? data[0] : data
  if (
    !row?.booking_id ||
    !row?.cancel_token ||
    !row?.merchant_uid ||
    row?.amount == null ||
    !row?.expires_at
  ) {
    throw new Error("Booking hold could not be created.")
  }

  return {
    bookingId: row.booking_id,
    cancelToken: row.cancel_token,
    merchantUid: row.merchant_uid,
    amount: row.amount,
    expiresAt: row.expires_at,
  }
}

export async function confirmBookingPaymentRpc(
  merchantUid: string,
  pgTid: string,
  pgProvider: string,
  amount: number,
): Promise<string> {
  const supabase = createServiceClient()

  const { data, error } = await supabase.rpc("confirm_booking_payment", {
    p_merchant_uid: merchantUid.trim(),
    p_pg_tid: pgTid.trim(),
    p_pg_provider: pgProvider.trim(),
    p_amount: amount,
  })

  if (error) {
    throw new Error(error.message)
  }

  if (!data) {
    throw new Error("Payment could not be confirmed.")
  }

  return data as string
}

export async function expireStaleBookingHoldsRpc(): Promise<number> {
  const supabase = createServiceClient()

  const { data, error } = await supabase.rpc("expire_stale_booking_holds")

  if (error) {
    throw new Error(error.message)
  }

  return typeof data === "number" ? data : 0
}
