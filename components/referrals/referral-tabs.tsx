"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"

/**
 * The three kinds of QR we hand out, and the two screens inside the third.
 *
 * Routes rather than client state: a tab you can link to is a tab someone can
 * send to a colleague, the back button behaves, and each one reads only its
 * own data instead of every screen loading all four.
 */

type Tab = { label: string; href: string; children?: Tab[] }

function tabsFor(base: string): Tab[] {
  return [
    { label: "사이트", href: base },
    { label: "선생", href: `${base}/partners` },
    {
      label: "예약",
      href: `${base}/bookings`,
      children: [
        { label: "예약 레퍼럴", href: `${base}/bookings` },
        { label: "바이럴 시드", href: `${base}/seeds` },
      ],
    },
  ]
}

export function ReferralTabs({ base }: { base: string }) {
  const pathname = usePathname()
  const tabs = tabsFor(base)

  const isOn = (href: string) =>
    href === base ? pathname === base : pathname.startsWith(href)

  // 예약 owns both of its children, so it stays lit while you are on either.
  const active =
    tabs.find((t) => (t.children ?? [t]).some((c) => isOn(c.href))) ?? tabs[0]

  return (
    <div className="space-y-3">
      <nav className="flex flex-wrap gap-1 border-b border-border">
        {tabs.map((tab) => (
          <Link
            key={tab.href}
            href={tab.href}
            className={`-mb-px border-b-2 px-4 py-2 text-sm transition-colors ${
              tab === active
                ? "border-primary font-medium text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            {tab.label}
          </Link>
        ))}
      </nav>

      {active.children ? (
        <nav className="flex flex-wrap gap-1">
          {active.children.map((child) => (
            <Link
              key={child.href}
              href={child.href}
              className={`rounded-full px-3.5 py-1.5 text-sm transition-colors ${
                isOn(child.href)
                  ? "bg-secondary font-medium text-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              {child.label}
            </Link>
          ))}
        </nav>
      ) : null}
    </div>
  )
}
