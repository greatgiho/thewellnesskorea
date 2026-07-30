"use client"

import { useState } from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { requestMemberLoginLink } from "@/app/u/actions"
import { FIELD_PUBLIC } from "@/lib/ui/field"

export function MemberLoginForm() {
  const searchParams = useSearchParams()
  const errorParam = searchParams.get("error")
  const queryError =
    errorParam === "wrong_account"
      ? "이 이메일은 회원 계정이 아닙니다. 파트너·관리자는 각자 로그인 페이지를 이용해 주세요."
      : errorParam === "auth"
        ? "로그인 링크가 만료되었거나 유효하지 않습니다. 다시 시도해 주세요."
        : null

  const [email, setEmail] = useState("")
  const [error, setError] = useState<string | null>(queryError)
  const [pending, setPending] = useState(false)

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setPending(true)
    try {
      await requestMemberLoginLink(email)
      const params = new URLSearchParams({ email: email.trim().toLowerCase() })
      window.location.href = `/login/check-email?${params.toString()}`
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send login link.")
      setPending(false)
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      {error ? (
        <p className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </p>
      ) : null}

      <label className="block space-y-1.5">
        <span className="text-sm font-medium">Email</span>
        <input
          type="email"
          required
          autoComplete="email"
          className={FIELD_PUBLIC}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
        />
      </label>

      <button
        type="submit"
        disabled={pending}
        className="inline-flex w-full items-center justify-center rounded-full bg-primary px-6 py-3 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-60"
      >
        {pending ? "Sending link…" : "Email me a sign-in link"}
      </button>

      <p className="text-center text-xs text-muted-foreground">
        No password needed. We&apos;ll email you a secure link.
      </p>

      <p className="text-center text-sm text-muted-foreground">
        New here?{" "}
        <Link href="/u/signup" className="text-primary underline-offset-4 hover:underline">
          Create an account
        </Link>
      </p>
    </form>
  )
}
