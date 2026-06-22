"use client"

import { useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"

function adminAccessError(role: string | undefined): string | null {
  if (role === "admin") return null
  if (role === "teacher") {
    return "This is a teacher account. Sign in at /teacher/login instead."
  }
  if (role === "member") {
    return "Member accounts cannot access admin. Use /login for member sign-in."
  }
  return "This account does not have admin access (app_metadata.role is not \"admin\"). Run: npm run set-admin-role -- your@email.com"
}

export function AdminLoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const queryError =
    searchParams.get("error") === "not_admin"
      ? "Signed in, but this account is not an admin. Run: npm run set-admin-role -- your@email.com"
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
      setError(authError.message)
      return
    }

    const role =
      typeof data.user?.app_metadata?.role === "string"
        ? data.user.app_metadata.role
        : undefined
    const accessError = adminAccessError(role)
    if (accessError) {
      await supabase.auth.signOut()
      setPending(false)
      setError(accessError)
      return
    }

    setPending(false)
    router.push("/admin/partners")
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
        <span className="text-sm font-medium">Email</span>
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
        <span className="text-sm font-medium">Password</span>
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
        {pending ? "Signing in…" : "Sign in"}
      </Button>
    </form>
  )
}
