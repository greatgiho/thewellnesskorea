"use client"

import { useEffect, useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { Menu, X } from "lucide-react"
import { useLang, type Lang } from "@/components/redesign/language-provider"

// #reserve belongs to components/redesign/reservation.tsx, which the homepage
// does not render — the section that actually lists bookable classes is
// UpcomingEvents, id="upcoming". Pointing at #reserve made every Reserve
// control on the page do nothing.
const LINKS: { href: string; label: { en: string; ko: string } }[] = [
  { href: "#philosophy", label: { en: "Philosophy", ko: "철학" } },
  { href: "#day", label: { en: "Day", ko: "낮" } },
  { href: "#night", label: { en: "Night", ko: "밤" } },
  { href: "#exhibition", label: { en: "Exhibition", ko: "전시" } },
  { href: "#upcoming", label: { en: "Reserve", ko: "예약" } },
]

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
  const [scrolled, setScrolled] = useState(false)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40)
    onScroll()
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-colors duration-300 ${
        scrolled ? "border-b border-border bg-background/85 backdrop-blur-md" : "bg-transparent"
      }`}
    >
      <nav className="relative mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <a href="#top" className="flex items-center gap-2" aria-label="The Wellness Korea, back to top">
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
        </a>

        <ul className="absolute left-1/2 hidden -translate-x-1/2 items-center gap-8 md:flex">
          {LINKS.map((link) => (
            <li key={link.href}>
              <a
                href={link.href}
                className="text-sm text-muted-foreground transition-colors hover:text-foreground"
              >
                {link.label[lang]}
              </a>
            </li>
          ))}
        </ul>

        <div className="hidden items-center gap-4 md:flex">
          <LangToggle />
          <Link
            href="/u/signin"
            className="text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            {lang === "ko" ? "로그인" : "Sign in"}
          </Link>
          <a
            href="#upcoming"
            className="rounded-full bg-primary px-5 py-2 text-sm text-primary-foreground transition-opacity hover:opacity-90"
          >
            {lang === "ko" ? "방문 예약" : "Book a visit"}
          </a>
        </div>

        <div className="flex items-center gap-2 md:hidden">
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
        <div className="border-t border-border bg-background/95 backdrop-blur-md md:hidden">
          <ul className="mx-auto flex max-w-6xl flex-col px-6 py-3">
            {LINKS.map((link) => (
              <li key={link.href}>
                <a
                  href={link.href}
                  onClick={() => setOpen(false)}
                  className="block py-3 text-base text-foreground"
                >
                  {link.label[lang]}
                </a>
              </li>
            ))}
            <li>
              <Link href="/u/signin" onClick={() => setOpen(false)} className="block py-3 text-base text-foreground">
                {lang === "ko" ? "로그인" : "Sign in"}
              </Link>
            </li>
            <li>
              <Link href="/u" onClick={() => setOpen(false)} className="block py-3 text-base text-foreground">
                {lang === "ko" ? "내 예약" : "My bookings"}
              </Link>
            </li>
          </ul>
        </div>
      )}
    </header>
  )
}
