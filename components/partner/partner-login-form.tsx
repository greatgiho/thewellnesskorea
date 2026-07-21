"use client"

import { useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"

export function PartnerLoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const errorParam = searchParams.get("error")
  const queryError =
    errorParam === "not_partner"
      ? "파트너 계정이 아닙니다. 관리자에게 문의해 주세요."
      : errorParam === "not_approved"
        ? "아직 승인 대기 중인 계정입니다. 승인 후 로그인할 수 있습니다."
        : errorParam === "no_profile"
          ? "연결된 파트너 프로필이 없습니다. 관리자에게 문의해 주세요."
          : null

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(queryError)
  const [pending, setPending] = useState(false)

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setPending(true)

    const supabase = createClient()
    const { data, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (authError) {
      setPending(false)
      setError("이메일 또는 비밀번호를 확인해 주세요.")
      return
    }

    const role = data.user?.app_metadata?.role
    if (role !== "partner") {
      await supabase.auth.signOut()
      setPending(false)
      setError("파트너 계정이 아닙니다. 관리자에게 문의해 주세요.")
      return
    }

    router.push("/p")
    router.refresh()
  }

  const fieldClass =
    "w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring/50"

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
      <label className="block space-y-2">
        <span className="text-sm font-medium">비밀번호</span>
        <input
          type="password"
          required
          autoComplete="current-password"
          className={fieldClass}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </label>
      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? "로그인 중…" : "로그인"}
      </Button>
    </form>
  )
}
