import { createClient } from "@/lib/supabase/server"

export async function adminCancelBookingWithAdminSession(
  bookingId: string,
): Promise<string> {
  const supabase = await createClient()

  const { data, error } = await supabase.rpc("admin_cancel_booking", {
    p_booking_id: bookingId,
  })

  if (error) {
    throw new Error(error.message)
  }

  if (!data) {
    throw new Error("Booking could not be cancelled.")
  }

  return data as string
}
