import {
  PortalSidebar,
  type PortalNavGroup,
} from "@/components/portal/portal-sidebar"
import { PortalMobileNav } from "@/components/portal/portal-mobile-nav"

/**
 * Admin/Partner 포털 공통 셸: 좌측 세로 사이드바 + 우측 상단바(사용자·로그아웃) + 본문.
 */
export function PortalShell({
  brand,
  groups,
  roots,
  userLabel,
  signOutAction,
  topRight,
  children,
}: {
  brand: string
  groups: PortalNavGroup[]
  roots: string[]
  userLabel: string
  signOutAction: () => Promise<void>
  topRight?: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <div className="flex min-h-screen bg-background">
      {/* 240px 사이드바는 phone 폭에서 본문을 150px로 눌러버린다 — md 미만에서는
          감추고 헤더의 PortalMobileNav 드로어가 대신한다. */}
      <aside className="hidden w-60 shrink-0 border-r border-border bg-card/40 md:block">
        <PortalSidebar brand={brand} groups={groups} roots={roots} />
      </aside>
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center gap-3 border-b border-border bg-card/30 px-4 py-3 text-sm sm:px-6 sm:gap-4">
          <PortalMobileNav brand={brand} groups={groups} roots={roots} />
          <span className="truncate font-serif text-base text-foreground md:hidden">
            {brand}
          </span>
          <div className="ml-auto flex min-w-0 items-center gap-3 sm:gap-4">
            {topRight}
            <span className="truncate text-muted-foreground">{userLabel}</span>
            <form action={signOutAction}>
              <button
                type="submit"
                className="whitespace-nowrap rounded-lg border border-border px-3 py-1.5 text-foreground transition-colors hover:bg-muted"
              >
                로그아웃
              </button>
            </form>
          </div>
        </header>
        <main className="min-w-0 flex-1 px-4 py-6 sm:px-6 sm:py-8">{children}</main>
      </div>
    </div>
  )
}
