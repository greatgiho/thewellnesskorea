"use client"

import { useState } from "react"
import Link from "next/link"
import { signUpPartner } from "@/app/p/signup-actions"
import { Button } from "@/components/ui/button"

const fieldClass =
  "w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring/50"

export function PartnerSignupForm() {
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState<null | { pending: boolean }>(null)

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)
    setPending(true)
    const f = new FormData(e.currentTarget)
    const res = await signUpPartner({
      email: String(f.get("email") ?? ""),
      password: String(f.get("password") ?? ""),
      nameKo: String(f.get("nameKo") ?? ""),
      nameEn: String(f.get("nameEn") ?? ""),
      kind: (String(f.get("kind") ?? "guide") as "guide" | "artist" | "brand"),
      roleKo: String(f.get("roleKo") ?? ""),
      roleEn: String(f.get("roleEn") ?? ""),
    })
    setPending(false)
    if (!res.ok) {
      setError(res.error)
      return
    }
    setDone({ pending: res.pending })
  }

  if (done) {
    return (
      <div className="space-y-4 text-sm">
        <p className="rounded-lg border border-border bg-card px-4 py-3">
          {done.pending
            ? "신청이 접수되었습니다. 관리자 승인 후 로그인할 수 있습니다."
            : "가입이 완료되었습니다. 이제 로그인할 수 있습니다."}
        </p>
        <Link href="/p/login" className="text-primary underline underline-offset-2">
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
        <span className="text-sm font-medium">이메일</span>
        <input name="email" type="email" required autoComplete="email" className={fieldClass} />
      </label>
      <label className="block space-y-2">
        <span className="text-sm font-medium">비밀번호 (8자 이상)</span>
        <input name="password" type="password" required minLength={8} autoComplete="new-password" className={fieldClass} />
      </label>
      <div className="grid grid-cols-2 gap-3">
        <label className="block space-y-2">
          <span className="text-sm font-medium">이름 (한글)</span>
          <input name="nameKo" type="text" required className={fieldClass} />
        </label>
        <label className="block space-y-2">
          <span className="text-sm font-medium">이름 (영문)</span>
          <input name="nameEn" type="text" required className={fieldClass} />
        </label>
      </div>
      <label className="block space-y-2">
        <span className="text-sm font-medium">구분</span>
        <select name="kind" className={fieldClass} defaultValue="guide">
          <option value="guide">Guide (가이드)</option>
          <option value="artist">Artist (아티스트)</option>
          <option value="brand">Brand (브랜드)</option>
        </select>
      </label>
      <div className="grid grid-cols-2 gap-3">
        <label className="block space-y-2">
          <span className="text-sm font-medium">직함 (한글)</span>
          <input name="roleKo" type="text" placeholder="예: 요가 지도자" className={fieldClass} />
        </label>
        <label className="block space-y-2">
          <span className="text-sm font-medium">직함 (영문)</span>
          <input name="roleEn" type="text" placeholder="e.g. Yoga Instructor" className={fieldClass} />
        </label>
      </div>
      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? "신청 중…" : "파트너 신청"}
      </Button>
      <p className="text-center text-xs text-muted-foreground">
        이미 계정이 있으신가요?{" "}
        <Link href="/p/login" className="text-primary underline underline-offset-2">
          로그인
        </Link>
      </p>
    </form>
  )
}
