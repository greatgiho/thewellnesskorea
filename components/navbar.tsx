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
  const [open, setOpen] = useState(false)

  useEffect(() => {
    if (!open) return
    const prev = document.body.style.overflow
    document.body.style.overflow = "hidden"
    return () => {
      document.body.style.overflow = prev
    }
  }, [open])

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
              href="#"
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
            <a
              href="/admin/login"
              className="text-sm font-medium text-foreground/70 transition-colors hover:text-foreground"
            >
              Admin
            </a>
            <a
              href="#schedule"
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
              <a
                href="/admin/login"
                onClick={() => setOpen(false)}
                className="rounded-lg px-2 py-3 text-lg font-medium text-foreground/80 transition-colors hover:bg-secondary hover:text-foreground"
              >
                Admin
              </a>
              <a
                href="#schedule"
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
