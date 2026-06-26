"use client"

import { useEffect } from "react"

/**
 * Page-level error boundary.
 * In production builds, `error.message` is always the generic Next.js string
 * ("An error occurred in the Server Components render…") — the real message
 * lives only in server logs (see instrumentation.ts / Vercel Function Logs).
 *
 * The `digest` is a short hash that lets you correlate this client error with
 * the corresponding server log line.
 */
export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  const isDev = process.env.NODE_ENV !== "production"

  useEffect(() => {
    // Also surfaces the digest in the browser console during development.
    console.error("[ErrorBoundary]", error)
  }, [error])

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-6 text-center">
      <p className="font-serif text-2xl text-foreground">Something went wrong</p>

      {isDev ? (
        // Development: show the actual message and stack
        <pre className="mt-4 max-w-2xl overflow-auto rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-left text-xs text-destructive">
          {error.message}
          {"\n\n"}
          {error.stack}
        </pre>
      ) : (
        // Production: show digest for log correlation
        <div className="mt-4 space-y-2">
          <p className="text-sm text-muted-foreground">
            An unexpected error occurred. Check Vercel Function Logs for details.
          </p>
          {error.digest && (
            <p className="font-mono text-xs text-muted-foreground/70">
              Error ID: <span className="select-all text-foreground">{error.digest}</span>
            </p>
          )}
        </div>
      )}

      <button
        onClick={reset}
        className="mt-6 rounded-md border border-border px-5 py-2 text-sm text-foreground transition-colors hover:bg-muted"
      >
        Try again
      </button>
    </div>
  )
}
