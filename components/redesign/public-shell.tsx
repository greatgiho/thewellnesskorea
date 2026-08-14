import type { ReactNode } from "react"
import {
  getBusinessInfo,
  isBusinessInfoEmpty,
} from "@/lib/site/business-info"
import { LanguageProvider } from "@/components/redesign/language-provider"
import { SiteNav } from "@/components/redesign/site-nav"
import { SiteFooter } from "@/components/redesign/site-footer"
import { SectionHeader } from "@/components/redesign/primitives"

/**
 * The chrome every page a visitor can reach sits inside.
 *
 * LanguageProvider has to be above the nav and the footer, not inside the
 * homepage, or the language toggle is missing everywhere except home — and the
 * chrome would crash on the pages that render it without a provider.
 *
 * SiteNav decides for itself whether it floats (homepage, over the hero) or
 * sits in flow, from the current route.
 *
 * `banner` is rendered above the nav, for the view-as strip. It is a slot rather
 * than something the caller puts in `children` because the nav has to come
 * after it in the document for the two to stack instead of overlap.
 *
 * There is no spacer under the nav: off the homepage SiteNav is sticky, not
 * fixed, so it already occupies its own height. The homepage is the exception —
 * its nav floats over the hero — and it needs no spacer for the same reason.
 *
 * Admin, partner, and viewer areas deliberately do not use this: they are tools
 * with their own dashboard chrome, not part of the public site.
 *
 * The business details are fetched here rather than in the footer because the
 * footer is a client component — it reads the language toggle — and this is
 * the nearest server component that every public page passes through.
 */
export async function PublicShell({
  banner,
  children,
}: {
  banner?: ReactNode
  children: ReactNode
}) {
  const business = await getBusinessInfo()

  return (
    <LanguageProvider>
      <div className="min-h-screen bg-background">
        {banner}
        <SiteNav />
        {children}
        <SiteFooter
          business={isBusinessInfoEmpty(business) ? null : business}
        />
      </div>
    </LanguageProvider>
  )
}

/**
 * A content page's opening block, in the same voice as the homepage sections.
 *
 * The pages that use it were built before the redesign and set their headings
 * with a mono, wide-tracked eyebrow over a light serif title. This keeps the
 * eyebrow/heading/lead relationship but in the redesign's scale and colour, so
 * a reader moving from the homepage into the booking flow does not cross a
 * visual seam.
 */
export function PageHeader({
  eyebrow,
  title,
  description,
}: {
  eyebrow?: string
  title: string
  description?: ReactNode
}) {
  return (
    <div className="mx-auto max-w-3xl px-6 pb-2 pt-14 lg:pt-20">
      <SectionHeader eyebrow={eyebrow} heading={title} lead={description} />
    </div>
  )
}
