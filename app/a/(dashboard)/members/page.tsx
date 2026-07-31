import type { Metadata } from "next"
import { requireAdminSession } from "@/lib/auth/require-session"
import { getAdminMembers } from "@/lib/members/admin-queries"
import { AdminMembersList } from "@/components/admin/admin-members-list"

export const metadata: Metadata = {
  title: "일반회원 — Admin",
}

type Props = { searchParams: Promise<{ q?: string }> }

export default async function AdminMembersPage({ searchParams }: Props) {
  const { supabase } = await requireAdminSession()
  const { q } = await searchParams
  const members = await getAdminMembers(supabase, q)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-3xl text-foreground">일반회원</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          회원 목록과 예약·결제 이력을 조회하고 계정 상태를 관리합니다.
        </p>
      </div>

      <AdminMembersList members={members} initialSearch={q ?? ""} />
    </div>
  )
}
