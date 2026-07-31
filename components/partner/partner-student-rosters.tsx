"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { Search } from "lucide-react"
import { cn } from "@/lib/utils"
import { FIELD } from "@/lib/ui/field"
import { formatSessionTime, isSessionEnded } from "@/lib/partner/utils"
import type { SessionRoster } from "@/lib/partner/queries"

type Props = {
  rosters: SessionRoster[]
  initialSearch: string
}

export function PartnerStudentRosters({ rosters, initialSearch }: Props) {
  const [search, setSearch] = useState(initialSearch)

  // Filtering happens here rather than on the server: the roster is already
  // loaded in full, so matching by student narrows the visible classes with no
  // round trip. A class is kept when any of its attendees match.
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return rosters
    return rosters
      .map((roster) => ({
        ...roster,
        attendees: roster.attendees.filter((attendee) =>
          [attendee.guest_name, attendee.guest_email, attendee.guest_phone].some(
            (field) => field?.toLowerCase().includes(q),
          ),
        ),
      }))
      .filter((roster) => roster.attendees.length > 0)
  }, [rosters, search])

  const upcoming = filtered.filter((r) => !isSessionEnded(r.session.ends_at))
  const past = filtered.filter((r) => isSessionEnded(r.session.ends_at))
  const totalAttendees = filtered.reduce((sum, r) => sum + r.attendees.length, 0)

  if (rosters.length === 0) {
    return (
      <div className="rounded-2xl border border-border bg-card px-6 py-10 text-center">
        <p className="text-sm text-muted-foreground">
          확정된 수업이 아직 없습니다.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="수강생 이름 · 이메일 · 연락처 검색"
          className={cn(FIELD, "pl-9")}
        />
      </div>

      <p className="text-sm text-muted-foreground">
        {search.trim()
          ? `${filtered.length}개 수업 · 수강생 ${totalAttendees}명`
          : `수업 ${rosters.length}개 · 수강생 연 ${totalAttendees}명`}
      </p>

      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-border bg-card px-6 py-10 text-center">
          <p className="text-sm text-muted-foreground">검색 결과가 없습니다.</p>
        </div>
      ) : (
        <>
          <RosterGroup title="예정 수업" rosters={upcoming} />
          <RosterGroup title="지난 수업" rosters={past} />
        </>
      )}
    </div>
  )
}

function RosterGroup({
  title,
  rosters,
}: {
  title: string
  rosters: SessionRoster[]
}) {
  if (rosters.length === 0) return null

  return (
    <section className="space-y-3">
      <h2 className="font-mono text-xs uppercase tracking-[0.25em] text-muted-foreground">
        {title} ({rosters.length})
      </h2>
      <ul className="space-y-3">
        {rosters.map(({ session, attendees }) => (
          <li
            key={session.id}
            className="overflow-hidden rounded-2xl border border-border bg-card"
          >
            <div className="flex flex-wrap items-start justify-between gap-3 border-b border-border px-5 py-4">
              <div className="min-w-0">
                <p className="font-medium text-foreground">{session.title}</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {formatSessionTime(session.starts_at, session.ends_at)}
                  {session.floor ? ` · ${session.floor.name_ko}` : ""}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-3">
                <span className="text-sm text-muted-foreground">
                  {attendees.length}/{session.capacity}명
                </span>
                <Link
                  href={`/p/sessions/${session.id}/bookings`}
                  className="text-sm text-primary underline-offset-4 hover:underline"
                >
                  상세
                </Link>
              </div>
            </div>

            {attendees.length === 0 ? (
              <p className="px-5 py-4 text-sm text-muted-foreground">
                아직 수강생이 없습니다.
              </p>
            ) : (
              <div className="-mx-0 overflow-x-auto">
                <table className="w-full min-w-[520px] text-left text-sm">
                  <thead className="bg-secondary/40 text-xs uppercase tracking-wider text-muted-foreground">
                    <tr>
                      <th className="px-5 py-2.5 font-medium">이름</th>
                      <th className="px-5 py-2.5 font-medium">이메일</th>
                      <th className="px-5 py-2.5 font-medium">연락처</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {attendees.map((attendee) => (
                      <tr key={attendee.id}>
                        <td className="px-5 py-2.5 text-foreground">
                          {attendee.guest_name}
                        </td>
                        <td className="px-5 py-2.5 text-muted-foreground">
                          {attendee.guest_email}
                        </td>
                        <td className="px-5 py-2.5 text-muted-foreground">
                          {attendee.guest_phone ?? "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </li>
        ))}
      </ul>
    </section>
  )
}
