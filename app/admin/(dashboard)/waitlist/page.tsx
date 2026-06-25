import type { Metadata } from "next"
import { requireAdminSession } from "@/lib/auth/require-session"
import { getWaitlistByDateRange } from "@/lib/waitlist/admin-queries"
import { todayDateKeyInKst, addDaysToDateKey } from "@/lib/schedule/utils"
import { formatScheduleDayHeading } from "@/lib/schedule/public-week"
import { formatTimeInKst } from "@/lib/schedule/utils"

export const metadata: Metadata = {
  title: "Waitlist — Admin",
}

export default async function AdminWaitlistPage() {
  await requireAdminSession()

  const start = todayDateKeyInKst()
  const end = addDaysToDateKey(start, 60)
  const sessions = await getWaitlistByDateRange(start, end)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-3xl text-foreground">Waitlist</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Guests waiting for a spot in full sessions (next 60 days). They will be
          notified automatically when someone cancels.
        </p>
      </div>

      {sessions.length === 0 ? (
        <div className="rounded-2xl border border-border bg-card px-6 py-10 text-center">
          <p className="text-sm text-muted-foreground">
            No pending waitlist entries.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {sessions.map((s) => (
            <div key={s.sessionId} className="rounded-2xl border border-border bg-card overflow-hidden">
              <div className="flex items-center justify-between border-b border-border px-6 py-4">
                <div>
                  <p className="font-medium text-foreground">{s.sessionTitle}</p>
                  <p className="mt-0.5 text-sm text-muted-foreground">
                    {formatScheduleDayHeading(s.startsAt.slice(0, 10))}
                    {" · "}
                    {formatTimeInKst(s.startsAt)} KST
                  </p>
                </div>
                <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                  {s.entries.length} waiting
                </span>
              </div>

              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left">
                    <th className="px-6 py-3 font-medium text-muted-foreground">Name</th>
                    <th className="px-6 py-3 font-medium text-muted-foreground">Email</th>
                    <th className="hidden px-6 py-3 font-medium text-muted-foreground sm:table-cell">Phone</th>
                    <th className="hidden px-6 py-3 font-medium text-muted-foreground sm:table-cell">Joined</th>
                  </tr>
                </thead>
                <tbody>
                  {s.entries.map((entry, i) => (
                    <tr
                      key={entry.id}
                      className={i < s.entries.length - 1 ? "border-b border-border" : ""}
                    >
                      <td className="px-6 py-3 text-foreground">{entry.guestName}</td>
                      <td className="px-6 py-3 text-foreground">{entry.guestEmail}</td>
                      <td className="hidden px-6 py-3 text-muted-foreground sm:table-cell">
                        {entry.guestPhone ?? "—"}
                      </td>
                      <td className="hidden px-6 py-3 text-muted-foreground sm:table-cell">
                        {new Intl.DateTimeFormat("en-US", {
                          dateStyle: "medium",
                          timeZone: "Asia/Seoul",
                        }).format(new Date(entry.createdAt))}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
