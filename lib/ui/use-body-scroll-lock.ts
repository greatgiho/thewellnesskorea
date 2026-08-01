"use client"

import { useEffect } from "react"

/**
 * Stop the page behind an overlay from scrolling while it is open.
 *
 * Restores whatever `overflow` was there before rather than clearing it, so
 * two overlays closing in the wrong order cannot leave the page stuck.
 */
export function useBodyScrollLock(locked: boolean): void {
  useEffect(() => {
    if (!locked) return
    const previous = document.body.style.overflow
    document.body.style.overflow = "hidden"
    return () => {
      document.body.style.overflow = previous
    }
  }, [locked])
}
