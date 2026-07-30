import type { ReactNode } from "react"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"

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
      <Navbar />
      {/* Spacer for the fixed 65px navbar. */}
      <div aria-hidden className="h-[65px]" />
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
      <Footer />
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
