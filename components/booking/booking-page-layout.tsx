import type { ReactNode } from "react"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"

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
      <Navbar />
      {/* Spacer for the fixed 65px navbar. */}
      <div aria-hidden className="h-[65px]" />
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
      <Footer />
    </div>
  )
}
