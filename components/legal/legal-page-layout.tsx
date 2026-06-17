import Link from "next/link"
import type { ReactNode } from "react"

type LegalPageLayoutProps = {
  title: string
  updated: string
  children: ReactNode
}

export function LegalPageLayout({
  title,
  updated,
  children,
}: LegalPageLayoutProps) {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-6 py-6">
          <Link
            href="/"
            className="font-serif text-xl text-foreground transition-opacity hover:opacity-70"
          >
            The Wellness Korea
          </Link>
          <Link
            href="/"
            className="text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            Back to home
          </Link>
        </div>
      </header>
      <article className="mx-auto max-w-3xl px-6 py-14 lg:py-20">
        <p className="font-mono text-xs uppercase tracking-[0.35em] text-primary">
          Legal
        </p>
        <h1 className="mt-4 font-serif text-4xl font-light text-foreground sm:text-5xl">
          {title}
        </h1>
        <p className="mt-3 text-sm text-muted-foreground">Last updated: {updated}</p>
        <div className="mt-12 space-y-8 text-base leading-relaxed text-foreground/90">
          {children}
        </div>
      </article>
    </div>
  )
}

function LegalSection({
  title,
  children,
}: {
  title: string
  children: ReactNode
}) {
  return (
    <section className="space-y-3">
      <h2 className="font-serif text-2xl font-light text-foreground">{title}</h2>
      <div className="space-y-3 text-muted-foreground">{children}</div>
    </section>
  )
}

export { LegalSection }
