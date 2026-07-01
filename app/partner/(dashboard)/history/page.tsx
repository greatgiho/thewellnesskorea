import Link from "next/link"
import { requirePartnerSession } from "@/lib/auth/require-partner-session"
import { getPastPartnerSessions } from "@/lib/partner/queries"
import { formatSessionTime } from "@/lib/partner/utils"

export default async function PartnerHistoryPage() {
  const { supabase, partner } = await requirePartnerSession()
  const sessions = await getPastPartnerSessions(supabase, partner.id)

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-serif text-3xl font-light text-foreground">수업 이력</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          완료된 클래스 목록입니다.
        </p>
      </div>

      {sessions.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border px-6 py-16 text-center text-muted-foreground">
          완료된 클래스가 없습니다.
        </div>
      ) : (
        <div className="space-y-3">
          {sessions.map((session) => (
            <div
              key={session.id}
              className="rounded-2xl border border-border bg-card/40 p-5"
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="space-y-1">
                  <p className="font-medium text-foreground">{session.title}</p>
                  <p className="text-sm text-muted-foreground">
                    {formatSessionTime(session.starts_at, session.ends_at)}
                  </p>
                  {session.floor && (
                    <p className="text-xs text-muted-foreground">
                      {session.floor.level}F · {session.floor.name_ko}
                    </p>
                  )}
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <p className="text-sm text-muted-foreground">
                    참석 {session.booked_count}명 / {session.capacity}명
                  </p>
                  <Link
                    href={`/partner/sessions/${session.id}/board`}
                    className="inline-flex h-8 items-center rounded-lg border border-border px-3 text-xs text-foreground hover:bg-muted"
                  >
                    게시판
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
