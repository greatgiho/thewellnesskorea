"use client"

import { useEffect, useState } from "react"

/**
 * Returns true once the referenced element enters the viewport.
 * Immediately returns true if the user prefers reduced motion.
 * Disconnects the observer after the first reveal (no toggling back).
 */
export function useReveal(
  ref: { current: HTMLElement | null },
  threshold = 0.25,
): boolean {
  const [revealed, setRevealed] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    const prefersReduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches

    if (prefersReduced) {
      setRevealed(true)
      return
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setRevealed(true)
          observer.disconnect()
        }
      },
      { threshold },
    )

    observer.observe(el)
    return () => observer.disconnect()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return revealed
}
