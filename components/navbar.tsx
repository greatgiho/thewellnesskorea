"use client"

import { useEffect, useState } from "react"
import { useBodyScrollLock } from "@/lib/ui/use-body-scroll-lock"
import { Menu, X } from "lucide-react"
import { createClient } from "@/lib/supabase/client"

const navLinks = [
  { label: "Philosophy", href: "/#philosophy" },
  { label: "Wellness Guides", href: "/#guides" },
  { label: "Artist", href: "/#arts" },
  { label: "Schedule", href: "/#schedule" },
  { label: "Journal", href: "/journal" },
]

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

export function Navbar() {
  const [open, setOpen] = useState(false)
  const [user, setUser] = useState<SessionUser | null>(null)

  useBodyScrollLock(open)

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
    const supabase = createClient()
    await supabase.auth.signOut()
    // Hard navigation so server components re-render without the session cookie.
    window.location.assign("/")
  }

  return (
    <>
      <header className="fixed inset-x-0 top-0 z-50 border-b border-border/60 bg-background">
        <nav className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5 lg:px-10">
          <div className="flex min-w-0 flex-1 items-center gap-3 md:flex-none">
            <button
              type="button"
              onClick={() => setOpen(true)}
              className="shrink-0 text-foreground md:hidden"
              aria-label="Open menu"
            >
              <Menu className="size-6" />
            </button>
            <a
              href="/"
              className="truncate font-serif text-xl font-medium tracking-tight text-foreground sm:text-2xl"
            >
              The Wellness Korea
            </a>
          </div>

          <div className="hidden items-center gap-10 md:flex">
            {navLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                className="text-sm font-medium text-foreground/70 transition-colors hover:text-foreground"
              >
                {link.label}
              </a>
            ))}
          </div>

          <div className="hidden items-center gap-6 md:flex">
            {user ? (
              <>
                <a
                  href="/u"
                  className="text-sm font-medium text-foreground/70 transition-colors hover:text-foreground"
                >
                  Welcome, {user.name}
                </a>
                <button
                  type="button"
                  onClick={signOut}
                  className="text-sm font-medium text-foreground/70 transition-colors hover:text-foreground"
                >
                  Sign out
                </button>
              </>
            ) : (
              <a
                href="/u/signin"
                className="text-sm font-medium text-foreground/70 transition-colors hover:text-foreground"
              >
                Sign in
              </a>
            )}
            <a
              href="/#schedule"
              className="inline-flex items-center rounded-full bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground transition-all duration-300 hover:scale-105 hover:bg-primary/90"
            >
              Book a Class
            </a>
          </div>
        </nav>
      </header>

      {open && (
        <div className="fixed inset-0 z-[60] md:hidden" role="dialog" aria-modal="true">
          <button
            type="button"
            className="absolute inset-0 bg-black/40"
            aria-label="Close menu"
            onClick={() => setOpen(false)}
          />
          <div className="absolute inset-0 flex flex-col bg-background">
            <div className="flex items-center justify-between border-b border-border/60 px-6 py-5">
              <span className="font-serif text-xl font-medium text-foreground">
                Menu
              </span>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="text-foreground"
                aria-label="Close menu"
              >
                <X className="size-6" />
              </button>
            </div>
            <div className="flex flex-1 flex-col gap-1 overflow-y-auto px-6 py-6">
              {navLinks.map((link) => (
                <a
                  key={link.label}
                  href={link.href}
                  onClick={() => setOpen(false)}
                  className="rounded-lg px-2 py-3 text-lg font-medium text-foreground/80 transition-colors hover:bg-secondary hover:text-foreground"
                >
                  {link.label}
                </a>
              ))}
              {user ? (
                <>
                  <a
                    href="/u"
                    onClick={() => setOpen(false)}
                    className="rounded-lg px-2 py-3 text-lg font-medium text-foreground/80 transition-colors hover:bg-secondary hover:text-foreground"
                  >
                    Welcome, {user.name}
                  </a>
                  <button
                    type="button"
                    onClick={() => {
                      setOpen(false)
                      void signOut()
                    }}
                    className="rounded-lg px-2 py-3 text-left text-lg font-medium text-foreground/80 transition-colors hover:bg-secondary hover:text-foreground"
                  >
                    Sign out
                  </button>
                </>
              ) : (
                <a
                  href="/u/signin"
                  onClick={() => setOpen(false)}
                  className="rounded-lg px-2 py-3 text-lg font-medium text-foreground/80 transition-colors hover:bg-secondary hover:text-foreground"
                >
                  Sign in
                </a>
              )}
              <a
                href="/#schedule"
                onClick={() => setOpen(false)}
                className="mt-4 inline-flex items-center justify-center rounded-full bg-primary px-6 py-3.5 text-sm font-medium text-primary-foreground"
              >
                Book a Class
              </a>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
