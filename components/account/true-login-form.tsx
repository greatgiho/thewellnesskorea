"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"

export function TrueLoginForm() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState(false)

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setPending(true)

    const supabase = createClient()
    const { data, error: authError } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    })

    if (authError) {
      setPending(false)
      setError("이메일 또는 비밀번호를 확인해 주세요.")
      return
    }

    const role = data.user?.app_metadata?.role
    const signupIntent = data.user?.user_metadata?.signup_intent
    if (role !== "member" && signupIntent !== "member") {
      await supabase.auth.signOut()
      setPending(false)
      setError("회원 계정이 아닙니다. 강사/관리자는 별도 로그인 페이지를 이용해 주세요.")
      return
    }

    router.push("/account")
    router.refresh()
  }

  const fieldClass =
    "w-full rounded-xl border border-border bg-background px-4 py-3 text-sm text-foreground outline-none transition-colors focus:border-primary/50 focus:ring-2 focus:ring-primary/20"

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
          className={fieldClass}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
        />
      </label>

      <label className="block space-y-1.5">
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

      <button
        type="submit"
        disabled={pending}
        className="inline-flex w-full items-center justify-center rounded-full bg-primary px-6 py-3 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-60"
      >
        {pending ? "로그인 중…" : "로그인"}
      </button>

      <p className="text-center text-sm text-muted-foreground">
        매직링크로 로그인하시겠어요?{" "}
        <Link href="/login" className="text-primary underline-offset-4 hover:underline">
          이메일 링크 로그인
        </Link>
      </p>
      <p className="text-center text-sm text-muted-foreground">
        처음이신가요?{" "}
        <Link href="/signup" className="text-primary underline-offset-4 hover:underline">
          회원가입
        </Link>
      </p>
    </form>
  )
}
