"use client"

import { useState } from "react"
import Link from "next/link"
import { acceptPartnerInvite } from "@/app/p/accept-invite-actions"
import { Button } from "@/components/ui/button"

const fieldClass =
  "w-full rounded-lg border border-border bg-background px-3 py-2.5 text-base sm:text-sm focus:outline-none focus:ring-2 focus:ring-ring/50"

export function PartnerAcceptInviteForm({ token }: { token: string }) {
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState(false)

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)
    const f = new FormData(e.currentTarget)
    const password = String(f.get("password") ?? "")
    const confirm = String(f.get("confirm") ?? "")
    if (password !== confirm) {
      setError("비밀번호가 일치하지 않습니다.")
      return
    }
    setPending(true)
    const res = await acceptPartnerInvite({ token, password })
    setPending(false)
    if (!res.ok) {
      setError(res.error)
      return
    }
    setDone(true)
  }

  if (!token) {
    return (
      <p className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
        잘못된 초대 링크입니다. 관리자에게 문의해 주세요.
      </p>
    )
  }

  if (done) {
    return (
      <div className="space-y-4 text-sm">
        <p className="rounded-lg border border-border bg-card px-4 py-3">
          비밀번호가 설정되었습니다. 이제 로그인할 수 있습니다.
        </p>
        <Link href="/p/signin" className="text-primary underline underline-offset-2">
          로그인으로 이동
        </Link>
      </div>
    )
  }

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      {error && (
        <p className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </p>
      )}
      <label className="block space-y-2">
        <span className="text-sm font-medium">비밀번호 (8자 이상)</span>
        <input name="password" type="password" required minLength={8} autoComplete="new-password" className={fieldClass} />
      </label>
      <label className="block space-y-2">
        <span className="text-sm font-medium">비밀번호 확인</span>
        <input name="confirm" type="password" required minLength={8} autoComplete="new-password" className={fieldClass} />
      </label>
      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? "설정 중…" : "비밀번호 설정"}
      </Button>
    </form>
  )
}
