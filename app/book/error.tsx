"use client"

import { useEffect } from "react"
import Link from "next/link"

export default function BookError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error("[BookError]", error)
  }, [error])

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-6 text-center">
      <p className="font-serif text-2xl text-foreground">Booking unavailable</p>
      <p className="mt-2 text-sm text-muted-foreground">
        {error.message ?? "Something went wrong while processing your booking."}
      </p>
      <div className="mt-6 flex gap-4">
        <button
          onClick={reset}
          className="rounded-md border border-border px-5 py-2 text-sm text-foreground transition-colors hover:bg-muted"
        >
          Try again
        </button>
        <Link
          href="/"
          className="rounded-md bg-foreground px-5 py-2 text-sm text-background transition-opacity hover:opacity-80"
        >
          Back to home
        </Link>
      </div>
    </div>
  )
}
