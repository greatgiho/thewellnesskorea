"use client"

import { useEffect, useState } from "react"
import { Menu, X } from "lucide-react"

const navLinks = [
  { label: "Philosophy", href: "#philosophy" },
  { label: "Wellness Guides", href: "#guides" },
  { label: "Artist", href: "#arts" },
  { label: "Schedule", href: "#schedule" },
]

export function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24)
    onScroll()
    window.addEventListener("scroll", onScroll)
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-all duration-500 ${
        scrolled
          ? "bg-background/80 backdrop-blur-md border-b border-border/60"
          : "bg-transparent"
      }`}
    >
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5 lg:px-10">
        <a
          href="#"
          className={`font-serif text-2xl font-medium tracking-tight transition-colors ${
            scrolled ? "text-foreground" : "text-foreground"
          }`}
        >
          The Wellness Korea
        </a>

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

        <div className="hidden md:block">
          <a
            href="#schedule"
            className="inline-flex items-center rounded-full bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground transition-all duration-300 hover:scale-105 hover:bg-primary/90"
          >
            Book a Class
          </a>
        </div>

        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="text-foreground md:hidden"
          aria-label={open ? "Close menu" : "Open menu"}
        >
          {open ? <X className="size-6" /> : <Menu className="size-6" />}
        </button>
      </nav>

      {open && (
        <div className="border-t border-border/60 bg-background/95 backdrop-blur-md md:hidden">
          <div className="flex flex-col gap-1 px-6 py-4">
            {navLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                onClick={() => setOpen(false)}
                className="rounded-lg px-2 py-3 text-base font-medium text-foreground/80 transition-colors hover:bg-secondary hover:text-foreground"
              >
                {link.label}
              </a>
            ))}
            <a
              href="#schedule"
              onClick={() => setOpen(false)}
              className="mt-2 inline-flex items-center justify-center rounded-full bg-primary px-6 py-3 text-sm font-medium text-primary-foreground"
            >
              Book a Class
            </a>
          </div>
        </div>
      )}
    </header>
  )
}
