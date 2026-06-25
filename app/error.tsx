"use client"

import { useEffect } from "react"

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error("[GlobalError]", error)
  }, [error])

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-6 text-center">
      <p className="font-serif text-2xl text-foreground">Something went wrong</p>
      <p className="mt-2 text-sm text-muted-foreground">
        {error.digest ? `Error ID: ${error.digest}` : "An unexpected error occurred."}
      </p>
      <button
        onClick={reset}
        className="mt-6 rounded-md border border-border px-5 py-2 text-sm text-foreground transition-colors hover:bg-muted"
      >
        Try again
      </button>
    </div>
  )
}
