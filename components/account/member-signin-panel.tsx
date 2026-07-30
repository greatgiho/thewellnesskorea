"use client"

import { useState } from "react"
import { TrueLoginForm } from "@/components/account/true-login-form"
import { MemberLoginForm } from "@/components/account/member-login-form"
import { GoogleSignInButton } from "@/components/account/google-signin-button"

type Mode = "password" | "link"

/**
 * Single member sign-in surface: password, magic email link, and Google — all
 * on /u/signin. Most members sign up passwordless (magic link), so the email
 * link mode is the primary path; password mode is for accounts that set one.
 */
export function MemberSignInPanel() {
  const [mode, setMode] = useState<Mode>("password")

  return (
    <div className="space-y-5 rounded-3xl border border-border bg-card p-6 shadow-sm sm:p-8">
      {mode === "password" ? <TrueLoginForm /> : <MemberLoginForm />}

      <p className="text-center text-sm text-muted-foreground">
        {mode === "password" ? (
          <button
            type="button"
            onClick={() => setMode("link")}
            className="text-primary underline-offset-4 hover:underline"
          >
            비밀번호 없이 이메일 링크로 로그인
          </button>
        ) : (
          <button
            type="button"
            onClick={() => setMode("password")}
            className="text-primary underline-offset-4 hover:underline"
          >
            비밀번호로 로그인
          </button>
        )}
      </p>

      <div className="flex items-center gap-3 text-xs text-muted-foreground">
        <span className="h-px flex-1 bg-border" />
        또는
        <span className="h-px flex-1 bg-border" />
      </div>
      <GoogleSignInButton />
    </div>
  )
}
