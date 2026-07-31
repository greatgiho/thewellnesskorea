import type { Metadata } from "next"
import { requirePartnerSession } from "@/lib/auth/require-partner-session"
import { getPartnerSessionRosters } from "@/lib/partner/queries"
import { PartnerStudentRosters } from "@/components/partner/partner-student-rosters"

export const metadata: Metadata = {
  title: "수강생 관리 — Partner",
}

type Props = { searchParams: Promise<{ q?: string }> }

export default async function PartnerStudentsPage({ searchParams }: Props) {
  const { supabase, partner } = await requirePartnerSession()
  const { q } = await searchParams
  const rosters = await getPartnerSessionRosters(supabase, partner.id)

  return (
    <div className="space-y-8">
      <div>
        <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
          Class Instructor
        </p>
        <h1 className="mt-2 font-serif text-3xl text-foreground">수강생 관리</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          내 수업의 수강생 명단을 한곳에서 조회합니다.
        </p>
      </div>

      <PartnerStudentRosters rosters={rosters} initialSearch={q ?? ""} />

      <section className="rounded-2xl border border-dashed border-border p-6">
        <span className="inline-flex rounded-full bg-amber-500/10 px-2.5 py-0.5 text-xs font-medium text-amber-700">
          준비 중
        </span>
        <h2 className="mt-3 font-serif text-xl font-light text-foreground">
          수강 문의(Q&amp;A) 응대
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          수업별 게시판(<code className="font-mono text-xs">session_posts</code>)은
          이미 있고 강사 글쓰기도 동작하지만, <strong>수강생이 글을 남길 입구가
          아직 없습니다</strong> — 회원 화면 쪽 작업이 선행돼야 합니다. 그래서
          응대할 문의가 아직 생기지 않습니다.
        </p>
        <p className="mt-2 text-xs text-muted-foreground/70">
          ※ 미구현. 강사 게시판은 <code className="font-mono">/p/sessions/[id]/board</code>에서
          사용할 수 있습니다.
        </p>
      </section>
    </div>
  )
}
