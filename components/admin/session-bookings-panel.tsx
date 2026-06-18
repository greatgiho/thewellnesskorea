"use client"

import { useCallback, useEffect, useState } from "react"
import {
  cancelBookingAsAdmin,
  fetchSessionBookings,
} from "@/app/admin/bookings/actions"
import { formatBookingDateTime } from "@/lib/bookings/format"
import type { AdminBookingItem } from "@/lib/bookings/admin-queries"

type SessionBookingsPanelProps = {
  sessionId: string
  capacity: number
  bookedCount: number
  onBookingChange?: () => void
}

export function SessionBookingsPanel({
  sessionId,
  capacity,
  bookedCount,
  onBookingChange,
}: SessionBookingsPanelProps) {
  const [bookings, setBookings] = useState<AdminBookingItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [pendingId, setPendingId] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const rows = await fetchSessionBookings(sessionId)
      setBookings(rows)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load bookings.")
    } finally {
      setLoading(false)
    }
  }, [sessionId])

  useEffect(() => {
    void load()
  }, [load])

  const onCancel = async (bookingId: string, guestName: string) => {
    if (!confirm(`Cancel booking for ${guestName}?`)) return
    setPendingId(bookingId)
    setError(null)
    try {
      await cancelBookingAsAdmin(bookingId)
      await load()
      onBookingChange?.()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to cancel booking.")
    } finally {
      setPendingId(null)
    }
  }

  const confirmedCount = bookings.filter((b) => b.status === "confirmed").length

  return (
    <div className="rounded-xl border border-border bg-secondary/20 p-4 space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-foreground">Reservations</p>
          <p className="text-xs text-muted-foreground">
            {bookedCount} / {capacity} spots booked
            {confirmedCount !== bookedCount
              ? ` (${confirmedCount} confirmed in list)`
              : ""}
          </p>
        </div>
        <button
          type="button"
          onClick={() => void load()}
          disabled={loading}
          className="text-xs font-medium text-primary hover:underline disabled:opacity-50"
        >
          Refresh
        </button>
      </div>

      {error ? (
        <p className="text-sm text-destructive">{error}</p>
      ) : null}

      {loading ? (
        <p className="text-sm text-muted-foreground">Loading bookings…</p>
      ) : bookings.length === 0 ? (
        <p className="text-sm text-muted-foreground">No bookings yet.</p>
      ) : (
        <ul className="space-y-3">
          {bookings.map((booking) => {
            const { heading, timeRange } = formatBookingDateTime(
              booking.sessionStartsAt,
              booking.sessionEndsAt,
            )
            const isConfirmed = booking.status === "confirmed"

            return (
              <li
                key={booking.id}
                className="rounded-lg border border-border bg-background px-3 py-3"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground">
                      {booking.guestName}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {booking.guestEmail}
                      {booking.guestPhone ? ` · ${booking.guestPhone}` : ""}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {heading} · {timeRange}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Booked {new Date(booking.createdAt).toLocaleString("en-GB")}
                      {booking.userId ? " · member account" : " · guest"}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                        isConfirmed
                          ? "bg-primary/10 text-primary"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {booking.status}
                    </span>
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
                  </div>
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
