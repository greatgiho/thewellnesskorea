import type { Metadata } from "next"
import { AdminBookingsClient } from "@/components/admin/admin-bookings-client"
import {
  fetchAdminSessionList,
  getDefaultBookingsDateRange,
} from "@/app/admin/bookings/actions"
import { getAllPartnersAdmin } from "@/lib/partners/queries"
import { addDaysToDateKey } from "@/lib/schedule/utils"

export const metadata: Metadata = {
  title: "Bookings — Admin",
}

type AdminBookingsPageProps = {
  searchParams: Promise<{
    start?: string
    end?: string
    instructor?: string
    title?: string
    guest?: string
  }>
}

export default async function AdminBookingsPage({
  searchParams,
}: AdminBookingsPageProps) {
  const defaults = await getDefaultBookingsDateRange()
  const params = await searchParams

  const startDateKey = params.start ?? defaults.start
  const endDateKey = params.end ?? defaults.end
  const instructorId = params.instructor ?? ""
  const titleSearch = params.title ?? ""
  const guestSearch = params.guest ?? ""

  const [sessions, partners] = await Promise.all([
    fetchAdminSessionList({
      startDateKey,
      endDateKeyExclusive: addDaysToDateKey(endDateKey, 1),
      instructorId: instructorId || undefined,
      titleSearch: titleSearch || undefined,
      guestSearch: guestSearch || undefined,
    }),
    getAllPartnersAdmin(),
  ])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-3xl text-foreground">Bookings</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Search sessions by date, instructor, or class name — or find a guest by name, email, or phone.
        </p>
      </div>

      <AdminBookingsClient
        sessions={sessions}
        partners={partners}
        startDateKey={startDateKey}
        endDateKey={endDateKey}
        instructorId={instructorId}
        titleSearch={titleSearch}
        guestSearch={guestSearch}
      />
    </div>
  )
}
