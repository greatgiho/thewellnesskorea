"use client"

import { useState } from "react"

/** Copies the referral link. The link is long and nobody retypes a QR by hand. */
export function CopyLinkButton({ link }: { link: string }) {
  const [copied, setCopied] = useState(false)

  return (
    <button
      type="button"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(link)
          setCopied(true)
          setTimeout(() => setCopied(false), 2000)
        } catch {
          // Clipboard is blocked without https or permission; the link is
          // printed above either way, so there is nothing to recover from.
        }
      }}
      className="inline-flex rounded-full border border-border px-4 py-1.5 text-xs text-foreground transition-colors hover:bg-secondary"
    >
      {copied ? "복사됨" : "링크 복사"}
    </button>
  )
}
