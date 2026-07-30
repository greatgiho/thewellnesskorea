import type { ReactNode } from "react"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"

/**
 * Shared chrome for public content pages (journal, partners, legal). The
 * Navbar is fixed, so pages that need their content below it add their own
 * offset; full-bleed pages (journal cover) let it overlay. Home stays out of
 * this group (its own hero/snap layout); /book keeps its wrapper (shared
 * server actions live under app/book).
 */
export default function SiteLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      {children}
      <Footer />
    </div>
  )
}
