"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

/**
 * Re-run the server component this sits in, on a timer.
 *
 * For screens whose truth changes without anyone here touching anything — the
 * counter waits on a customer's phone, and a barista watching a QR should not
 * have to reload to find out the drink was paid for.
 *
 * Rendered only while there is something to wait for, so a screen at rest
 * makes no requests. Mount it conditionally rather than passing `enabled`:
 * unmounting is what stops the timer.
 */
export function AutoRefresh({ intervalMs = 4000 }: { intervalMs?: number }) {
  const router = useRouter()

  useEffect(() => {
    const timer = setInterval(() => router.refresh(), intervalMs)
    return () => clearInterval(timer)
  }, [router, intervalMs])

  return null
}
