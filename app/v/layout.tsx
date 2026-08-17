import { requireViewerSession } from "@/lib/auth/require-viewer-session"
import { signOut } from "@/app/a/actions"
import { ViewerNav } from "@/components/viewer/viewer-nav"

/**
 * Shell for the read-only collaborator dashboard.
 *
 * Deliberately not PortalShell: that shell is built around a sidebar of
 * grouped sections, and /v has two screens. Keeping it separate also means
 * nothing here can accidentally grow an admin menu item.
 */
export default async function ViewerLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { user, role } = await requireViewerSession()

  return (
    <div className="min-h-screen bg-background">
      <header className="flex flex-wrap items-center gap-3 border-b border-border bg-card/30 px-4 py-3 text-sm sm:px-6">
        <span className="font-serif text-base text-foreground">
          The Wellness Korea
        </span>
        <span className="rounded-full bg-secondary px-2 py-0.5 text-xs text-muted-foreground">
          읽기 전용
        </span>
        <ViewerNav />
        <div className="ml-auto flex min-w-0 items-center gap-3">
          {role === "admin" ? (
            <a
              href="/a/schedule"
              className="whitespace-nowrap text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
            >
              어드민
            </a>
          ) : null}
          <span className="truncate text-muted-foreground">{user.email}</span>
          <form action={signOut}>
            <button
              type="submit"
              className="whitespace-nowrap rounded-lg border border-border px-3 py-1.5 text-foreground transition-colors hover:bg-muted"
            >
              로그아웃
            </button>
          </form>
        </div>
      </header>
      <main className="px-4 py-6 sm:px-6 sm:py-8">{children}</main>
    </div>
  )
}
