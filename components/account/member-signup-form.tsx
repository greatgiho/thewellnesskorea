"use client"

import { useState } from "react"
import Link from "next/link"
import { requestMemberSignupLink } from "@/app/account/actions"

type MemberSignupFormProps = {
  defaultEmail?: string
  defaultName?: string
}

export function MemberSignupForm({
  defaultEmail = "",
  defaultName = "",
}: MemberSignupFormProps) {
  const [name, setName] = useState(defaultName)
  const [email, setEmail] = useState(defaultEmail)
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState(false)

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setPending(true)
    try {
      await requestMemberSignupLink(name, email)
      const params = new URLSearchParams({
        email: email.trim().toLowerCase(),
      })
      window.location.href = `/login/check-email?${params.toString()}`
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send sign-up link.")
      setPending(false)
    }
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
        <span className="text-sm font-medium">Full name</span>
        <input
          type="text"
          required
          autoComplete="name"
          className={fieldClass}
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Your name"
        />
      </label>

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

      <button
        type="submit"
        disabled={pending}
        className="inline-flex w-full items-center justify-center rounded-full bg-primary px-6 py-3 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-60"
      >
        {pending ? "Sending link…" : "Create account with email link"}
      </button>

      <p className="text-center text-xs text-muted-foreground">
        We&apos;ll email a link to verify your address. Past guest bookings on the
        same email will be linked automatically.
      </p>

      <p className="text-center text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link href="/login" className="text-primary underline-offset-4 hover:underline">
          Sign in
        </Link>
      </p>
    </form>
  )
}
