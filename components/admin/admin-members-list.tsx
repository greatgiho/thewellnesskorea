"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Search } from "lucide-react"
import { cn } from "@/lib/utils"
import { FIELD } from "@/lib/ui/field"
import { formatDateKeyInKst, formatDisplayDate } from "@/lib/schedule/utils"
import type { AdminMemberListItem } from "@/lib/members/admin-queries"

type Props = {
  members: AdminMemberListItem[]
  initialSearch: string
}

export function AdminMembersList({ members, initialSearch }: Props) {
  const router = useRouter()
  const [search, setSearch] = useState(initialSearch)

  // Search runs on the server (email lives in auth, not in `members`), so the
  // query string is the source of truth and the box just drives it.
  const submit = () => {
    const q = search.trim()
    router.push(q ? `/a/members?q=${encodeURIComponent(q)}` : "/a/members")
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && submit()}
            placeholder="이름 · 이메일 · 연락처 검색"
            className={cn(FIELD, "pl-9")}
          />
        </div>
        <button
          type="button"
          onClick={submit}
          className="h-11 shrink-0 rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 sm:h-9"
        >
          검색
        </button>
        {initialSearch ? (
          <Link
            href="/a/members"
            className="h-11 shrink-0 rounded-lg border border-border px-4 text-sm leading-[2.75rem] text-muted-foreground transition-colors hover:bg-muted sm:h-9 sm:leading-9"
          >
            초기화
          </Link>
        ) : null}
      </div>

      <p className="text-sm text-muted-foreground">
        {initialSearch
          ? `"${initialSearch}" 검색 결과 ${members.length}명`
          : `총 ${members.length}명`}
      </p>

      {members.length === 0 ? (
        <div className="rounded-2xl border border-border bg-card px-6 py-10 text-center">
          <p className="text-sm text-muted-foreground">
            {initialSearch ? "검색 결과가 없습니다." : "아직 가입한 회원이 없습니다."}
          </p>
        </div>
      ) : (
        <div className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
          <div className="min-w-[680px] overflow-hidden rounded-2xl border border-border">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-border bg-secondary/50 text-xs uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 font-medium">이름</th>
                  <th className="px-4 py-3 font-medium">이메일</th>
                  <th className="px-4 py-3 font-medium">연락처</th>
                  <th className="px-4 py-3 font-medium">예약</th>
                  <th className="px-4 py-3 font-medium">가입일</th>
                  <th className="px-4 py-3 font-medium">상태</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {members.map((member) => (
                  <tr key={member.id} className="bg-card transition-colors hover:bg-muted/40">
                    <td className="px-4 py-3">
                      <Link
                        href={`/a/members/${member.id}`}
                        className="font-medium text-foreground underline-offset-4 hover:underline"
                      >
                        {member.name ?? "(이름 없음)"}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {member.email ?? "—"}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {member.phone ?? "—"}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {member.bookingCount}건
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {formatDisplayDate(formatDateKeyInKst(new Date(member.createdAt)))}
                    </td>
                    <td className="px-4 py-3">
                      {member.banned ? (
                        <span className="rounded-full bg-destructive/10 px-2 py-0.5 text-xs font-medium text-destructive">
                          차단됨
                        </span>
                      ) : (
                        <span className="text-xs text-muted-foreground">정상</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
