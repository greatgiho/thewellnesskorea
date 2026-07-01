import { notFound } from "next/navigation"
import Link from "next/link"
import { requirePartnerSession } from "@/lib/auth/require-partner-session"
import { getSessionPosts } from "@/lib/partner/queries"
import { formatSessionTime, isSessionEnded } from "@/lib/partner/utils"
import { SessionBoard } from "@/components/partner/session-board"

type Props = { params: Promise<{ id: string }> }

export default async function SessionBoardPage({ params }: Props) {
  const { id } = await params
  const { supabase, partner } = await requirePartnerSession()

  const { data: session } = await supabase
    .from("sessions")
    .select("id, title, starts_at, ends_at, status")
    .eq("id", id)
    .eq("instructor_id", partner.id)
    .maybeSingle()

  if (!session) notFound()

  const ended = isSessionEnded(session.ends_at)
  const posts = ended ? await getSessionPosts(supabase, id) : []

  return (
    <div className="space-y-8">
      <div>
        <Link
          href="/partner/history"
          className="text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
        >
          ← 수업 이력
        </Link>
        <h1 className="mt-3 font-serif text-2xl font-light text-foreground">
          {session.title}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {formatSessionTime(session.starts_at, session.ends_at)} · 클래스 게시판
        </p>
      </div>

      {!ended ? (
        <div className="rounded-2xl border border-dashed border-border px-6 py-12 text-center text-sm text-muted-foreground">
          수업 종료 후에 게시판이 활성화됩니다.
        </div>
      ) : (
        <SessionBoard
          sessionId={id}
          posts={posts}
          partnerName={partner.name_ko}
        />
      )}
    </div>
  )
}
