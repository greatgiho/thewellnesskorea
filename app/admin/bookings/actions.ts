"use server"

import { revalidatePath } from "next/cache"
import { requireAdminSession } from "@/lib/auth/require-session"
import {
  getAdminBookings,
  getBookingsForSessionAdmin,
  type AdminBookingsFilter,
} from "@/lib/bookings/admin-queries"
import { adminCancelBookingWithAdminSession } from "@/lib/bookings/admin-cancel"
import type { BookingStatus } from "@/lib/bookings/types"
import { todayDateKeyInKst, addDaysToDateKey } from "@/lib/schedule/utils"

function revalidateBookingCaches() {
  revalidatePath("/admin/bookings")
  revalidatePath("/admin/schedule")
  revalidatePath("/")
  revalidatePath("/account/bookings")
}

export async function fetchSessionBookings(sessionId: string) {
  const { supabase } = await requireAdminSession()
  return getBookingsForSessionAdmin(supabase, sessionId)
}

export async function fetchAdminBookings(
  startDateKey: string,
  endDateKeyInclusive: string,
  status: BookingStatus | "all" = "all",
) {
  const { supabase } = await requireAdminSession()
  const endExclusive = addDaysToDateKey(endDateKeyInclusive, 1)
  const filter: AdminBookingsFilter = {
    startDateKey,
    endDateKeyExclusive: endExclusive,
    status,
  }
  return getAdminBookings(supabase, filter)
}

export async function cancelBookingAsAdmin(bookingId: string): Promise<void> {
  await requireAdminSession()
  await adminCancelBookingWithAdminSession(bookingId)
  revalidateBookingCaches()
}

export async function getDefaultBookingsDateRange() {
  const start = todayDateKeyInKst()
  const end = addDaysToDateKey(start, 30)
  return { start, end }
}
