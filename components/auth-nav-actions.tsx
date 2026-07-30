"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"

type SessionUser = { name: string }

function displayName(user: {
  email?: string | null
  app_metadata?: Record<string, unknown>
  user_metadata?: Record<string, unknown>
}): string {
  const fromApp = user.app_metadata?.name
  if (typeof fromApp === "string" && fromApp.trim()) return fromApp.trim()
  const fromUser = user.user_metadata?.name
  if (typeof fromUser === "string" && fromUser.trim()) return fromUser.trim()
  const local = user.email?.split("@")[0]
  return local || "Member"
}

/**
 * Inline header auth actions for pages that render their own header (booking
 * pages, etc.) instead of the main Navbar. Reads the session client-side and
 * shows "Welcome, <name>" + Sign out when signed in, otherwise Sign in — so
 * these headers stop showing "Sign in" to logged-in members.
 */
export function AuthNavActions({
  className = "text-muted-foreground transition-colors hover:text-foreground",
}: {
  className?: string
}) {
  const [user, setUser] = useState<SessionUser | null>(null)

  useEffect(() => {
    const supabase = createClient()
    let active = true

    supabase.auth.getUser().then(({ data }) => {
      if (active && data.user) setUser({ name: displayName(data.user) })
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!active) return
      setUser(session?.user ? { name: displayName(session.user) } : null)
    })

    return () => {
      active = false
      subscription.unsubscribe()
    }
  }, [])

  const signOut = async () => {
    await createClient().auth.signOut()
    window.location.assign("/")
  }

  if (user) {
    return (
      <>
        <a href="/u" className={className}>
          Welcome, {user.name}
        </a>
        <button type="button" onClick={signOut} className={className}>
          Sign out
        </button>
      </>
    )
  }

  return (
    <a href="/u/signin" className={className}>
      Sign in
    </a>
  )
}
