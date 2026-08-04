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
      ? "This email is not a member account. Partners and admins should use their own sign-in page."
      : errorParam === "auth"
        ? "That sign-in link has expired or is not valid. Please try again."
        : null

  const [email, setEmail] = useState("")
  const [error, setError] = useState<string | null>(queryError)
  const [pending, setPending] = useState(false)

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setPending(true)
    const result = await requestMemberLoginLink(email)
    if (!result.ok) {
      setError(result.error)
      setPending(false)
      return
    }
    const params = new URLSearchParams({ email: email.trim().toLowerCase() })
    window.location.href = `/u/check-email?${params.toString()}`
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
