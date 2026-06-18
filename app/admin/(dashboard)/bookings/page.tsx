import type { Metadata } from "next"
import { AdminBookingsClient } from "@/components/admin/admin-bookings-client"
import {
  fetchAdminBookings,
  getDefaultBookingsDateRange,
} from "@/app/admin/bookings/actions"
import type { BookingStatus } from "@/lib/bookings/types"

export const metadata: Metadata = {
  title: "Bookings — Admin",
}

type AdminBookingsPageProps = {
  searchParams: Promise<{
    start?: string
    end?: string
    status?: string
  }>
}

export default async function AdminBookingsPage({
  searchParams,
}: AdminBookingsPageProps) {
  const defaults = await getDefaultBookingsDateRange()
  const params = await searchParams

  const startDateKey = params.start ?? defaults.start
  const endDateKey = params.end ?? defaults.end
  const statusParam = params.status ?? "all"
  const status: BookingStatus | "all" =
    statusParam === "confirmed" ||
    statusParam === "cancelled" ||
    statusParam === "no_show"
      ? statusParam
      : "all"

  const bookings = await fetchAdminBookings(startDateKey, endDateKey, status)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-3xl text-foreground">Bookings</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          View reservations by date, export CSV, or cancel on behalf of guests.
        </p>
      </div>

      <AdminBookingsClient
        bookings={bookings}
        startDateKey={startDateKey}
        endDateKey={endDateKey}
        status={status}
      />
    </div>
  )
}
