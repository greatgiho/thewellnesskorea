"use client"

import { useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { cancelBookingAsAdmin } from "@/app/admin/bookings/actions"
import { formatBookingDateTime } from "@/lib/bookings/format"
import type { AdminBookingItem } from "@/lib/bookings/admin-queries"
import type { BookingStatus } from "@/lib/bookings/types"

type AdminBookingsClientProps = {
  bookings: AdminBookingItem[]
  startDateKey: string
  endDateKey: string
  status: BookingStatus | "all"
}

function escapeCsv(value: string): string {
  if (/[",\n]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`
  }
  return value
}

function bookingsToCsv(rows: AdminBookingItem[]): string {
  const header = [
    "status",
    "guest_name",
    "guest_email",
    "guest_phone",
    "session_title",
    "session_starts_at",
    "session_ends_at",
    "floor",
    "instructor",
    "booked_at",
    "member_linked",
  ]
  const lines = rows.map((row) =>
    [
      row.status,
      row.guestName,
      row.guestEmail,
      row.guestPhone ?? "",
      row.sessionTitle,
      row.sessionStartsAt,
      row.sessionEndsAt,
      row.floorName,
      row.instructorName,
      row.createdAt,
      row.userId ? "yes" : "no",
    ]
      .map((cell) => escapeCsv(String(cell)))
      .join(","),
  )
  return [header.join(","), ...lines].join("\n")
}

export function AdminBookingsClient({
  bookings,
  startDateKey,
  endDateKey,
  status,
}: AdminBookingsClientProps) {
  const router = useRouter()
  const [pendingId, setPendingId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [localStart, setLocalStart] = useState(startDateKey)
  const [localEnd, setLocalEnd] = useState(endDateKey)
  const [localStatus, setLocalStatus] = useState<BookingStatus | "all">(status)

  const confirmedCount = useMemo(
    () => bookings.filter((b) => b.status === "confirmed").length,
    [bookings],
  )

  const applyFilters = () => {
    const params = new URLSearchParams({
      start: localStart,
      end: localEnd,
      status: localStatus,
    })
    router.push(`/admin/bookings?${params.toString()}`)
  }

  const onExport = () => {
    const csv = bookingsToCsv(bookings)
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement("a")
    anchor.href = url
    anchor.download = `bookings-${localStart}-to-${localEnd}.csv`
    anchor.click()
    URL.revokeObjectURL(url)
  }

  const onCancel = async (bookingId: string, guestName: string) => {
    if (!confirm(`Cancel booking for ${guestName}?`)) return
    setPendingId(bookingId)
    setError(null)
    try {
      await cancelBookingAsAdmin(bookingId)
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to cancel booking.")
    } finally {
      setPendingId(null)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end gap-4 rounded-xl border border-border bg-card p-4">
        <label className="block space-y-1">
          <span className="text-xs font-medium text-muted-foreground">From</span>
          <input
            type="date"
            value={localStart}
            onChange={(e) => setLocalStart(e.target.value)}
            className="rounded-lg border border-border bg-background px-3 py-2 text-sm"
          />
        </label>
        <label className="block space-y-1">
          <span className="text-xs font-medium text-muted-foreground">To</span>
          <input
            type="date"
            value={localEnd}
            onChange={(e) => setLocalEnd(e.target.value)}
            className="rounded-lg border border-border bg-background px-3 py-2 text-sm"
          />
        </label>
        <label className="block space-y-1">
          <span className="text-xs font-medium text-muted-foreground">Status</span>
          <select
            value={localStatus}
            onChange={(e) =>
              setLocalStatus(e.target.value as BookingStatus | "all")
            }
            className="rounded-lg border border-border bg-background px-3 py-2 text-sm"
          >
            <option value="all">All</option>
            <option value="confirmed">Confirmed</option>
            <option value="cancelled">Cancelled</option>
            <option value="no_show">No show</option>
          </select>
        </label>
        <button
          type="button"
          onClick={applyFilters}
          className="inline-flex h-9 items-center rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          Apply
        </button>
        <button
          type="button"
          onClick={onExport}
          disabled={bookings.length === 0}
          className="inline-flex h-9 items-center rounded-lg border border-border px-4 text-sm font-medium hover:bg-muted disabled:opacity-50"
        >
          Export CSV
        </button>
      </div>

      <p className="text-sm text-muted-foreground">
        {bookings.length} booking{bookings.length === 1 ? "" : "s"}
        {confirmedCount > 0 ? ` · ${confirmedCount} confirmed` : ""}
      </p>

      {error ? <p className="text-sm text-destructive">{error}</p> : null}

      {bookings.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border px-6 py-16 text-center text-sm text-muted-foreground">
          No bookings in this date range.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-border bg-muted/40 text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="px-4 py-3">Guest</th>
                <th className="px-4 py-3">Class</th>
                <th className="px-4 py-3">When</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Booked</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {bookings.map((booking) => {
                const { heading, timeRange } = formatBookingDateTime(
                  booking.sessionStartsAt,
                  booking.sessionEndsAt,
                )
                const isConfirmed = booking.status === "confirmed"

                return (
                  <tr key={booking.id} className="border-b border-border/60">
                    <td className="px-4 py-3 align-top">
                      <p className="font-medium text-foreground">
                        {booking.guestName}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {booking.guestEmail}
                      </p>
                      {booking.guestPhone ? (
                        <p className="text-xs text-muted-foreground">
                          {booking.guestPhone}
                        </p>
                      ) : null}
                      {booking.userId ? (
                        <p className="text-xs text-primary">Member</p>
                      ) : null}
                    </td>
                    <td className="px-4 py-3 align-top">
                      <p>{booking.sessionTitle}</p>
                      <p className="text-xs text-muted-foreground">
                        {booking.floorName} · {booking.instructorName}
                      </p>
                    </td>
                    <td className="px-4 py-3 align-top text-muted-foreground">
                      <p>{heading}</p>
                      <p className="text-xs">{timeRange}</p>
                    </td>
                    <td className="px-4 py-3 align-top">
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                          isConfirmed
                            ? "bg-primary/10 text-primary"
                            : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {booking.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 align-top text-xs text-muted-foreground">
                      {new Date(booking.createdAt).toLocaleString("en-GB")}
                    </td>
                    <td className="px-4 py-3 align-top">
                      {isConfirmed ? (
                        <button
                          type="button"
                          disabled={pendingId === booking.id}
                          onClick={() => void onCancel(booking.id, booking.guestName)}
                          className="text-xs font-medium text-destructive hover:underline disabled:opacity-50"
                        >
                          {pendingId === booking.id ? "Cancelling…" : "Cancel"}
                        </button>
                      ) : null}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
