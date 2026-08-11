"use client"

import { useEffect, useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Menu, X } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { useLang, type Lang } from "@/components/redesign/language-provider"
import { PAGE_LINKS, SECTION_LINKS, sectionHref } from "@/components/redesign/nav-links"

/**
 * The site header, on every page a visitor can reach.
 *
 * Two things it has to do that the design original did not, because the
 * original only ever sat on the homepage:
 *
 *  - Resolve its anchors against the current route (see sectionHref).
 *  - Go solid immediately when there is no hero behind it. On the homepage it
 *    starts transparent over the hero canvas and gains a background on scroll;
 *    anywhere else, transparent means unreadable text over the page content.
 *
 * It also carries the signed-in state the old Navbar had. Without it a signed-in
 * member is shown "Sign in" on every page, with no way to reach their bookings
 * or sign out.
 */

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

function LangToggle({ className = "" }: { className?: string }) {
  const { lang, setLang } = useLang()
  const options: { value: Lang; label: string }[] = [
    { value: "en", label: "EN" },
    { value: "ko", label: "KO" },
  ]
  return (
    <div
      className={`inline-flex items-center rounded-full border border-border bg-background/70 p-0.5 backdrop-blur-sm ${className}`}
      role="group"
      aria-label="Language"
    >
      {options.map((o) => (
        <button
          key={o.value}
          onClick={() => setLang(o.value)}
          className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
            lang === o.value ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
          }`}
          aria-pressed={lang === o.value}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}

export function SiteNav() {
  const { lang } = useLang()
  const pathname = usePathname()
  const onHome = pathname === "/"
  const [scrolled, setScrolled] = useState(false)
  const [open, setOpen] = useState(false)
  const [user, setUser] = useState<SessionUser | null>(null)

  useEffect(() => {
    if (!onHome) return
    const onScroll = () => setScrolled(window.scrollY > 40)
    onScroll()
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
  }, [onHome])

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

  const solid = scrolled || !onHome

  return (
    <header
      className={
        // On the homepage the nav floats over the hero canvas, so it has to be
        // fixed and start transparent. Everywhere else it is sticky instead of
        // fixed: it then occupies space, so content pages need no spacer under
        // it, and anything sticky above it (the view-as banner) still stacks.
        onHome
          ? `fixed inset-x-0 top-0 z-50 transition-colors duration-300 ${
              solid ? "border-b border-border bg-background/85 backdrop-blur-md" : "bg-transparent"
            }`
          : "sticky top-0 z-40 border-b border-border bg-background/85 backdrop-blur-md"
      }
    >
      {/* Three columns, not a centred absolute block. The original centred the
          links with position:absolute, which works only while the two ends stay
          short: taken out of the layout, the middle cannot be pushed, so a
          signed-in name simply lands on top of it. A grid keeps the links
          centred and makes the columns share the width. */}
      <nav className="mx-auto grid max-w-6xl grid-cols-[auto_1fr_auto] items-center gap-4 px-6 py-4">
        <Link
          href={onHome ? "#top" : "/"}
          className="flex items-center gap-2"
          aria-label="The Wellness Korea, back to top"
        >
          <Image
            src="/images/wellness-korea-logo.png"
            alt="The Wellness Korea"
            width={40}
            height={40}
            className="h-9 w-auto object-contain"
          />
          <span className="hidden font-serif text-lg tracking-wide text-foreground sm:inline">
            {lang === "ko" ? "더 웰니스 코리아" : "The Wellness Korea"}
          </span>
        </Link>

        {/* Scrolls rather than overlaps if the ends ever outgrow the room —
            the failure this replaces was silent, and a scrollbar is not. */}
        <ul className="hide-scrollbar hidden min-w-0 items-center justify-center gap-8 overflow-x-auto lg:flex">
          {SECTION_LINKS.map((link) => (
            <li key={link.id}>
              <a
                href={sectionHref(pathname, link.id)}
                className="whitespace-nowrap text-sm text-muted-foreground transition-colors hover:text-foreground"
              >
                {link.label[lang]}
              </a>
            </li>
          ))}
          <li>
            <Link
              href="/journal"
              className="whitespace-nowrap text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              {lang === "ko" ? "저널" : "Journal"}
            </Link>
          </li>
        </ul>

        <div className="hidden items-center justify-end gap-4 lg:flex">
          <LangToggle />
          {user ? (
            <>
              {/* The name alone. "Welcome, " was roughly a nav link's worth of
                  width spent saying nothing, and it is what tipped the bar over
                  at common laptop widths. */}
              <Link
                href="/u/bookings"
                className="max-w-[8rem] truncate text-sm text-muted-foreground transition-colors hover:text-foreground"
                title={user.name}
              >
                {user.name}
              </Link>
              <button
                type="button"
                onClick={signOut}
                className="text-sm text-muted-foreground transition-colors hover:text-foreground"
              >
                {lang === "ko" ? "로그아웃" : "Sign out"}
              </button>
            </>
          ) : (
            <Link
              href="/u/signin"
              className="text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              {lang === "ko" ? "로그인" : "Sign in"}
            </Link>
          )}
          <a
            href={sectionHref(pathname, "upcoming")}
            className="rounded-full bg-primary px-5 py-2 text-sm text-primary-foreground transition-opacity hover:opacity-90"
          >
            {lang === "ko" ? "방문 예약" : "Book a visit"}
          </a>
        </div>

        <div className="flex items-center gap-2 lg:hidden">
          <LangToggle />
          <button
            className="inline-flex items-center justify-center rounded-md p-2 text-foreground"
            onClick={() => setOpen((v) => !v)}
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </nav>

      {open && (
        <div className="border-t border-border bg-background/95 backdrop-blur-md lg:hidden">
          <ul className="mx-auto flex max-w-6xl flex-col px-6 py-3">
            {SECTION_LINKS.map((link) => (
              <li key={link.id}>
                <a
                  href={sectionHref(pathname, link.id)}
                  onClick={() => setOpen(false)}
                  className="block py-3 text-base text-foreground"
                >
                  {link.label[lang]}
                </a>
              </li>
            ))}
            {PAGE_LINKS.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  onClick={() => setOpen(false)}
                  className="block py-3 text-base text-foreground"
                >
                  {link.label[lang]}
                </Link>
              </li>
            ))}
            {user ? (
              <>
                <li>
                  <Link
                    href="/u/bookings"
                    onClick={() => setOpen(false)}
                    className="block py-3 text-base text-foreground"
                  >
                    {lang === "ko" ? "내 예약" : "My bookings"}
                  </Link>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => {
                      setOpen(false)
                      void signOut()
                    }}
                    className="block w-full py-3 text-left text-base text-foreground"
                  >
                    {lang === "ko" ? "로그아웃" : "Sign out"}
                  </button>
                </li>
              </>
            ) : (
              <li>
                <Link
                  href="/u/signin"
                  onClick={() => setOpen(false)}
                  className="block py-3 text-base text-foreground"
                >
                  {lang === "ko" ? "로그인" : "Sign in"}
                </Link>
              </li>
            )}
          </ul>
        </div>
      )}
    </header>
  )
}
