"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"

export type PortalNavItem = {
  label: string
  href: string
  /** "skeleton" = 아직 미구현(더미) 메뉴 */
  status?: "skeleton"
}

export type PortalNavGroup = {
  title?: string
  items: PortalNavItem[]
}

function isActive(pathname: string, href: string, roots: string[]): boolean {
  if (pathname === href) return true
  // 포털 루트(/a, /p)는 정확히 일치할 때만 active
  if (roots.includes(href)) return false
  return pathname.startsWith(href + "/") || pathname.startsWith(href)
}

export function PortalSidebar({
  brand,
  groups,
  roots,
}: {
  brand: string
  groups: PortalNavGroup[]
  roots: string[]
}) {
  const pathname = usePathname()

  return (
    <nav className="flex h-full flex-col gap-6 p-4">
      <div className="px-2 pt-2 font-serif text-lg text-foreground">{brand}</div>
      <div className="flex flex-col gap-5">
        {groups.map((group, gi) => (
          <div key={group.title ?? `g${gi}`} className="flex flex-col gap-1">
            {group.title ? (
              <p className="px-2 pb-1 text-[11px] font-medium uppercase tracking-wider text-muted-foreground/70">
                {group.title}
              </p>
            ) : null}
            {group.items.map((item) => {
              const active = isActive(pathname, item.href, roots)
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center justify-between rounded-lg px-2 py-1.5 text-sm transition-colors ${
                    active
                      ? "bg-secondary font-medium text-foreground"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  }`}
                >
                  <span>{item.label}</span>
                  {item.status === "skeleton" ? (
                    <span className="ml-2 rounded-full bg-amber-500/10 px-1.5 py-0.5 text-[10px] font-medium text-amber-700">
                      준비
                    </span>
                  ) : null}
                </Link>
              )
            })}
          </div>
        ))}
      </div>
    </nav>
  )
}
