import type { ReactNode } from "react"
import { PublicShell } from "@/components/redesign/public-shell"

/**
 * The centred card the member sign-in, sign-up, and check-email pages share.
 *
 * These pages used to stand outside the site chrome and repeat their own
 * wordmark and "Back to home" link. Both are in SiteNav now, so they are
 * dropped rather than shown twice, and the eyebrow follows the redesign's
 * section-header idiom instead of the old mono, wide-tracked one.
 *
 * The card stays narrow and centred: this is the one place on the public site
 * where a single task should hold the whole screen.
 */
export function AuthPageFrame({
  eyebrow = "Member",
  title,
  description,
  children,
  footer,
}: {
  eyebrow?: string
  title: string
  description?: ReactNode
  children: ReactNode
  footer?: ReactNode
}) {
  return (
    <PublicShell>
      <main className="px-6 py-16 lg:py-24">
        <div className="mx-auto w-full max-w-md space-y-8">
          <div className="text-center">
            <p className="text-sm uppercase tracking-[0.2em] text-[var(--sage)]">
              {eyebrow}
            </p>
            <h1 className="mt-4 font-serif text-3xl leading-tight text-foreground text-balance sm:text-4xl">
              {title}
            </h1>
            {description ? (
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground text-pretty">
                {description}
              </p>
            ) : null}
          </div>

          <div className="space-y-5 rounded-3xl border border-border bg-card p-6 shadow-sm sm:p-8">
            {children}
          </div>

          {footer ? (
            <p className="text-center text-xs text-muted-foreground">{footer}</p>
          ) : null}
        </div>
      </main>
    </PublicShell>
  )
}
