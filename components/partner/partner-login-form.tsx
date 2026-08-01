"use client"

import { useState } from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { requestPartnerLoginLink } from "@/app/p/signin-actions"
import { FIELD_ROOMY } from "@/lib/ui/field"
import { Button } from "@/components/ui/button"

export function PartnerLoginForm() {
  const searchParams = useSearchParams()
  const errorParam = searchParams.get("error")
  const queryError =
    errorParam === "not_partner"
      ? "파트너 계정이 아닙니다. 관리자에게 문의해 주세요."
      : errorParam === "not_approved"
        ? "아직 승인 대기 중인 계정입니다. 승인 후 로그인할 수 있습니다."
        : errorParam === "no_profile"
          ? "연결된 파트너 프로필이 없습니다. 관리자에게 문의해 주세요."
          : errorParam === "auth"
            ? "로그인 링크가 만료되었거나 유효하지 않습니다. 다시 시도해 주세요."
            : null

  const [email, setEmail] = useState("")
  const [error, setError] = useState<string | null>(queryError)
  const [sent, setSent] = useState(false)
  const [pending, setPending] = useState(false)

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setPending(true)
    const result = await requestPartnerLoginLink(email)
    if (result.ok) setSent(true)
    else setError(result.error)
    setPending(false)
  }

  const fieldClass = FIELD_ROOMY

  if (sent) {
    return (
      <div className="space-y-4">
        <p className="rounded-lg border border-primary/20 bg-primary/5 px-4 py-3 text-sm text-foreground">
          <span className="font-medium">{email}</span>로 로그인 링크를 보냈습니다.
          메일함을 확인해 링크를 눌러 로그인하세요.
        </p>
        <button
          type="button"
          onClick={() => {
            setSent(false)
            setEmail("")
          }}
          className="text-sm text-muted-foreground underline underline-offset-2 hover:text-foreground"
        >
          다른 이메일로 다시 시도
        </button>
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
        <span className="text-sm font-medium">이메일</span>
        <input
          type="email"
          required
          autoComplete="email"
          className={fieldClass}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </label>
      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? "링크 보내는 중…" : "로그인 링크 받기"}
      </Button>
      <p className="text-center text-xs text-muted-foreground">
        비밀번호 없이 이메일로 받은 링크를 눌러 로그인합니다.
      </p>
      <p className="text-center text-sm text-muted-foreground">
        아직 파트너가 아니신가요?{" "}
        <Link
          href="/p/signup"
          className="text-primary underline underline-offset-2"
        >
          파트너 신청
        </Link>
      </p>
    </form>
  )
}
