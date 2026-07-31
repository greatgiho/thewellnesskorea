"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { setMemberBanned } from "@/app/a/members/actions"

type Props = {
  memberId: string
  banned: boolean
}

export function MemberAccountStatus({ memberId, banned }: Props) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const toggle = () => {
    const next = !banned
    const question = next
      ? "이 회원의 로그인을 차단할까요? 기존 예약은 유지됩니다."
      : "이 회원의 로그인 차단을 해제할까요?"
    if (!window.confirm(question)) return

    setError(null)
    startTransition(async () => {
      const result = await setMemberBanned(memberId, next)
      if (!result.ok) {
        setError(result.error)
        return
      }
      router.refresh()
    })
  }

  return (
    <section className="rounded-2xl border border-border bg-card p-6">
      <h2 className="font-mono text-xs uppercase tracking-[0.25em] text-muted-foreground">
        계정 상태
      </h2>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-4">
        <div className="min-w-0">
          <p className="text-sm font-medium text-foreground">
            {banned ? "차단됨 — 로그인할 수 없습니다." : "정상 — 로그인할 수 있습니다."}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            차단은 로그인만 막습니다. 이미 확정된 예약은 취소되지 않으니, 필요하면
            예약을 따로 취소하세요.
          </p>
        </div>

        <button
          type="button"
          onClick={toggle}
          disabled={pending}
          className={
            banned
              ? "h-11 shrink-0 rounded-lg border border-border px-4 text-sm font-medium text-foreground transition-colors hover:bg-muted disabled:opacity-60 sm:h-9"
              : "h-11 shrink-0 rounded-lg bg-destructive/10 px-4 text-sm font-medium text-destructive transition-colors hover:bg-destructive/20 disabled:opacity-60 sm:h-9"
          }
        >
          {pending ? "처리 중…" : banned ? "차단 해제" : "로그인 차단"}
        </button>
      </div>

      {error ? (
        <p className="mt-3 text-sm text-destructive">{error}</p>
      ) : null}
    </section>
  )
}
