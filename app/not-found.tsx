import type { Metadata } from "next"
import Link from "next/link"

/**
 * Belt and braces for the routes the proxy does not pre-check.
 *
 * Next answers 200 for any streamed response, so a page that calls notFound()
 * after its shell has flushed serves this body under a 200 and a crawler reads
 * it as a real page. noindex is what stops a dead URL being indexed even when
 * the status cannot say so.
 */
export const metadata: Metadata = {
  robots: { index: false, follow: false },
}

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-6 text-center">
      <p className="font-serif text-5xl text-foreground">404</p>
      <p className="mt-4 text-base text-muted-foreground">
        The page you&apos;re looking for doesn&apos;t exist.
      </p>
      <Link
        href="/"
        className="mt-6 text-sm text-foreground underline-offset-4 hover:underline"
      >
        Back to home
      </Link>
    </div>
  )
}
