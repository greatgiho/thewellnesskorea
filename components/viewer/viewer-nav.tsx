"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"

const ITEMS = [
  { label: "스케줄", href: "/v" },
  { label: "레퍼럴", href: "/v/referrals" },
]

/**
 * The two screens a read-only collaborator has.
 *
 * Inline in the header rather than a sidebar: at two items a portal shell is
 * more chrome than content, and keeping /v off PortalShell is what stops an
 * admin menu item from ever appearing here by accident.
 */
export function ViewerNav() {
  const pathname = usePathname()

  return (
    <nav className="flex items-center gap-1">
      {ITEMS.map((item) => {
        const active =
          item.href === "/v" ? pathname === "/v" : pathname.startsWith(item.href)
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`rounded-lg px-2.5 py-1 transition-colors ${
              active
                ? "bg-secondary font-medium text-foreground"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            }`}
          >
            {item.label}
          </Link>
        )
      })}
    </nav>
  )
}
