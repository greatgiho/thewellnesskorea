"use client"

import { useState } from "react"
import { useSearchParams } from "next/navigation"
import { requestTeacherMagicLink } from "@/app/apply/actions"

export function ApplyLoginForm() {
  const searchParams = useSearchParams()
  const [inviteCode, setInviteCode] = useState("twk2026")
  const [email, setEmail] = useState("")
  const [error, setError] = useState<string | null>(
    searchParams.get("error") === "auth"
      ? "Login link expired or invalid. Please try again."
      : null,
  )
  const [pending, setPending] = useState(false)

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setPending(true)
    try {
      await requestTeacherMagicLink(inviteCode, email)
      const params = new URLSearchParams({ email })
      window.location.href = `/apply/check-email?${params.toString()}`
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send login link.")
    } finally {
      setPending(false)
    }
  }

  const fieldClass =
    "w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring/50"

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      {error && (
        <p className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </p>
      )}

      <label className="block space-y-1.5">
        <span className="text-sm font-medium">초대 코드</span>
        <input
          required
          className={fieldClass}
          value={inviteCode}
          onChange={(e) => setInviteCode(e.target.value)}
          autoComplete="off"
        />
      </label>

      <label className="block space-y-1.5">
        <span className="text-sm font-medium">이메일</span>
        <input
          type="email"
          required
          className={fieldClass}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
        />
      </label>

      <button
        type="submit"
        disabled={pending}
        className="inline-flex h-10 w-full items-center justify-center rounded-lg bg-primary text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
      >
        {pending ? "보내는 중…" : "로그인 링크 받기"}
      </button>

      <p className="text-center text-xs text-muted-foreground">
        비밀번호 없이 이메일 링크로 로그인합니다.
      </p>
    </form>
  )
}
