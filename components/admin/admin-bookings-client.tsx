"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Search } from "lucide-react"
import { formatBookingDateTime } from "@/lib/bookings/format"
import type { AdminSessionSummary } from "@/lib/bookings/admin-queries"
import type { PartnerWithPrograms } from "@/lib/partners/types"

type AdminBookingsClientProps = {
  sessions: AdminSessionSummary[]
  partners: PartnerWithPrograms[]
  startDateKey: string
  endDateKey: string
  instructorId: string
  titleSearch: string
  guestSearch: string
}

export function AdminBookingsClient({
  sessions,
  partners,
  startDateKey,
  endDateKey,
  instructorId,
  titleSearch,
  guestSearch,
}: AdminBookingsClientProps) {
  const router = useRouter()

  const [localStart, setLocalStart] = useState(startDateKey)
  const [localEnd, setLocalEnd] = useState(endDateKey)
  const [localInstructor, setLocalInstructor] = useState(instructorId)
  const [localTitle, setLocalTitle] = useState(titleSearch)
  const [localGuest, setLocalGuest] = useState(guestSearch)
  const [instructorSearch, setInstructorSearch] = useState("")
  const [instructorOpen, setInstructorOpen] = useState(false)

  const selectedInstructor = partners.find((p) => p.id === localInstructor)

  const filteredInstructors = partners
    .filter((p) => {
      if (!instructorSearch.trim()) return true
      const q = instructorSearch.toLowerCase()
      return (
        p.name_ko.toLowerCase().includes(q) ||
        p.name_en.toLowerCase().includes(q)
      )
    })
    .slice(0, 10)

  const applyFilters = () => {
    const params = new URLSearchParams()
    params.set("start", localStart)
    params.set("end", localEnd)
    if (localInstructor) params.set("instructor", localInstructor)
    if (localTitle.trim()) params.set("title", localTitle.trim())
    if (localGuest.trim()) params.set("guest", localGuest.trim())
    router.push(`/admin/bookings?${params.toString()}`)
  }

  const totalConfirmed = sessions.reduce((s, r) => s + r.confirmedCount, 0)
  const totalWaiting = sessions.reduce((s, r) => s + r.waitlistCount, 0)

  return (
    <div className="space-y-6">
      {/* ── Filters ── */}
      <div className="rounded-xl border border-border bg-card p-4 space-y-4">
        <div className="flex flex-wrap items-end gap-4">
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
          <label className="block space-y-1 flex-1 min-w-[160px]">
            <span className="text-xs font-medium text-muted-foreground">Class name</span>
            <input
              type="text"
              value={localTitle}
              onChange={(e) => setLocalTitle(e.target.value)}
              placeholder="Search by title…"
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
              onKeyDown={(e) => e.key === "Enter" && applyFilters()}
            />
          </label>
          <label className="block space-y-1 flex-1 min-w-[200px]">
            <span className="text-xs font-medium text-muted-foreground">Guest (name / email / phone)</span>
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                value={localGuest}
                onChange={(e) => setLocalGuest(e.target.value)}
                placeholder="Search guest…"
                className="w-full rounded-lg border border-border bg-background pl-9 pr-3 py-2 text-sm"
                onKeyDown={(e) => e.key === "Enter" && applyFilters()}
              />
            </div>
          </label>
        </div>

        {/* Instructor picker */}
        <div className="space-y-1.5">
          <span className="text-xs font-medium text-muted-foreground">Instructor</span>
          {selectedInstructor ? (
            <div className="flex items-center gap-3 rounded-lg border border-primary/30 bg-primary/5 px-3 py-2">
              <p className="flex-1 text-sm font-medium text-foreground">
                {selectedInstructor.name_en}
                <span className="ml-1 font-normal text-muted-foreground">
                  · {selectedInstructor.name_ko}
                </span>
              </p>
              <button
                type="button"
                onClick={() => { setLocalInstructor(""); setInstructorSearch("") }}
                className="text-xs text-primary underline-offset-4 hover:underline"
              >
                Clear
              </button>
            </div>
          ) : (
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                value={instructorSearch}
                onChange={(e) => { setInstructorSearch(e.target.value); setInstructorOpen(true) }}
                onFocus={() => setInstructorOpen(true)}
                onBlur={() => setTimeout(() => setInstructorOpen(false), 150)}
                placeholder="Search instructor…"
                className="w-full rounded-lg border border-border bg-background pl-9 pr-3 py-2 text-sm"
              />
              {instructorOpen && filteredInstructors.length > 0 && (
                <ul className="absolute z-10 mt-1 max-h-48 w-full overflow-y-auto rounded-xl border border-border bg-background shadow-md">
                  {filteredInstructors.map((p) => (
                    <li key={p.id}>
                      <button
                        type="button"
                        onMouseDown={() => {
                          setLocalInstructor(p.id)
                          setInstructorSearch("")
                          setInstructorOpen(false)
                        }}
                        className="flex w-full items-center gap-2 border-b border-border/60 px-3 py-2.5 text-left text-sm last:border-b-0 hover:bg-muted/60"
                      >
                        <span className="font-medium">{p.name_en}</span>
                        <span className="text-muted-foreground">· {p.name_ko}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={applyFilters}
          className="inline-flex h-9 items-center rounded-lg bg-primary px-5 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          Search
        </button>
      </div>

      {/* ── Summary ── */}
      <p className="text-sm text-muted-foreground">
        {sessions.length} session{sessions.length !== 1 ? "s" : ""}
        {totalConfirmed > 0 ? ` · ${totalConfirmed} confirmed bookings` : ""}
        {totalWaiting > 0 ? ` · ${totalWaiting} on waitlist` : ""}
      </p>

      {/* ── Session cards ── */}
      {sessions.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border px-6 py-16 text-center text-sm text-muted-foreground">
          No sessions found for the selected filters.
        </div>
      ) : (
        <div className="space-y-3">
          {sessions.map((session) => {
            const { heading, timeRange } = formatBookingDateTime(
              session.sessionStartsAt,
              session.sessionEndsAt,
            )
            const isFull = session.bookedCount >= session.capacity

            return (
              <Link
                key={session.sessionId}
                href={`/admin/bookings/sessions/${session.sessionId}`}
                className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-border bg-card px-5 py-4 transition-colors hover:bg-muted/40"
              >
                <div className="min-w-0 space-y-0.5">
                  <p className="font-medium text-foreground">{session.sessionTitle}</p>
                  <p className="text-sm text-muted-foreground">
                    {heading} · {timeRange}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {session.instructorName} · {session.floorName}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                    {session.confirmedCount} / {session.capacity} booked
                  </span>
                  {isFull && (
                    <span className="rounded-full bg-destructive/10 px-3 py-1 text-xs font-medium text-destructive">
                      Full
                    </span>
                  )}
                  {session.waitlistCount > 0 && (
                    <span className="rounded-full bg-muted px-3 py-1 text-xs font-medium text-muted-foreground">
                      {session.waitlistCount} waiting
                    </span>
                  )}
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
