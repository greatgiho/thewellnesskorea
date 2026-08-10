import type { ReactNode } from "react"
import { PublicShell } from "@/components/redesign/public-shell"

/**
 * Shared chrome for public content pages (journal, partners, legal).
 *
 * These used to carry the pre-redesign Navbar and Footer, whose links pointed
 * at homepage sections the redesign no longer has (#schedule, #guides, #arts,
 * #paths, #why-korea). Every one of them was a dead anchor from here.
 *
 * Home stays out of this group — it renders the shell itself, flush under the
 * hero. /book keeps its own wrapper, because shared server actions live under
 * app/book.
 */
export default function SiteLayout({ children }: { children: ReactNode }) {
  return <PublicShell>{children}</PublicShell>
}
