"use server"

import { revalidatePath } from "next/cache"
import { requireAdminSession } from "@/lib/auth/require-session"
import {
  getAdminBookings,
  getAdminSessionList,
  getBookingsForSessionAdmin,
  type AdminBookingsFilter,
  type AdminSessionFilter,
} from "@/lib/bookings/admin-queries"
import { adminCancelBookingWithAdminSession } from "@/lib/bookings/admin-cancel"
import { getBookingSummaryById } from "@/lib/bookings/queries"
import type { BookingStatus } from "@/lib/bookings/types"
import { todayDateKeyInKst, addDaysToDateKey } from "@/lib/schedule/utils"
import { formatBookingDateTime } from "@/lib/bookings/format"
import { notifyWaitlist } from "@/lib/waitlist/notify"

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

  // Fetch summary before cancelling so we have session info for waitlist
  const summary = await getBookingSummaryById(bookingId)

  await adminCancelBookingWithAdminSession(bookingId)
  revalidateBookingCaches()

  // Notify waitlist — fire-and-forget
  if (summary) {
    const { heading, timeRange } = formatBookingDateTime(
      summary.sessionStartsAt,
      summary.sessionEndsAt,
    )
    notifyWaitlist({
      sessionId: summary.sessionId,
      sessionTitle: summary.sessionTitle,
      heading,
      timeRange,
    }).catch((err) => console.error("[waitlist] notify failed:", err))
  }
}

export async function fetchAdminSessionList(filter: AdminSessionFilter) {
  const { supabase } = await requireAdminSession()
  return getAdminSessionList(supabase, filter)
}

export async function deleteWaitlistEntryAsAdmin(entryId: string): Promise<void> {
  const { supabase } = await requireAdminSession()
  const { error } = await supabase.rpc("delete_waitlist_entry", {
    p_entry_id: entryId,
  })
  if (error) throw new Error(error.message)
  revalidateBookingCaches()
}

export async function getDefaultBookingsDateRange() {
  const start = todayDateKeyInKst()
  const end = addDaysToDateKey(start, 30)
  return { start, end }
}
