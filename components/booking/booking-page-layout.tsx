import Link from "next/link"
import type { ReactNode } from "react"

type BookingPageLayoutProps = {
  eyebrow: string
  title: string
  description?: string
  children: ReactNode
}

export function BookingPageLayout({
  eyebrow,
  title,
  description,
  children,
}: BookingPageLayoutProps) {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-4 px-6 py-6">
          <Link
            href="/"
            className="font-serif text-xl text-foreground transition-opacity hover:opacity-70"
          >
            The Wellness Korea
          </Link>
          <div className="flex items-center gap-4 text-sm">
            <Link
              href="/login"
              className="text-muted-foreground transition-colors hover:text-foreground"
            >
              Sign in
            </Link>
            <Link
              href="/#schedule"
              className="text-muted-foreground transition-colors hover:text-foreground"
            >
              Schedule
            </Link>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-3xl px-6 py-14 lg:py-20">
        <p className="font-mono text-xs uppercase tracking-[0.35em] text-primary">
          {eyebrow}
        </p>
        <h1 className="mt-4 font-serif text-4xl font-light text-foreground sm:text-5xl">
          {title}
        </h1>
        {description ? (
          <p className="mt-4 text-pretty leading-relaxed text-muted-foreground">
            {description}
          </p>
        ) : null}
        <div className="mt-10">{children}</div>
      </main>
    </div>
  )
}
