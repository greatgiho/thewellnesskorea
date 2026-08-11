import type { ReactNode } from "react"
import { PublicShell, PageHeader } from "@/components/redesign/public-shell"

type BookingPageLayoutProps = {
  eyebrow: string
  title: string
  description?: string
  children: ReactNode
}

/**
 * The frame around every step of the booking flow.
 *
 * The heading used to be a mono, wide-tracked eyebrow over a light serif title
 * — its own idiom, predating the redesign. It now uses the same section header
 * the homepage does, so arriving here from an Upcoming row does not cross a
 * visual seam mid-booking.
 */
export function BookingPageLayout({
  eyebrow,
  title,
  description,
  children,
}: BookingPageLayoutProps) {
  return (
    <PublicShell>
      <PageHeader eyebrow={eyebrow} title={title} description={description} />
      <main className="mx-auto max-w-3xl px-6 pb-20 pt-10 lg:pb-28">
        {children}
      </main>
    </PublicShell>
  )
}
