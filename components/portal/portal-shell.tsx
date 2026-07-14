import {
  PortalSidebar,
  type PortalNavGroup,
} from "@/components/portal/portal-sidebar"

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
      <aside className="w-60 shrink-0 border-r border-border bg-card/40">
        <PortalSidebar brand={brand} groups={groups} roots={roots} />
      </aside>
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center justify-end gap-4 border-b border-border bg-card/30 px-6 py-3 text-sm">
          {topRight}
          <span className="text-muted-foreground">{userLabel}</span>
          <form action={signOutAction}>
            <button
              type="submit"
              className="rounded-lg border border-border px-3 py-1.5 text-foreground transition-colors hover:bg-muted"
            >
              로그아웃
            </button>
          </form>
        </header>
        <main className="min-w-0 flex-1 px-6 py-8">{children}</main>
      </div>
    </div>
  )
}
