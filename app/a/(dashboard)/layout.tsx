import Link from "next/link"
import { signOut } from "@/app/a/actions"
import { requireAdminSession } from "@/lib/auth/require-session"
import { PortalShell } from "@/components/portal/portal-shell"
import { ADMIN_NAV } from "@/lib/portal/nav"

export default async function AdminDashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { userEmail } = await requireAdminSession()

  return (
    <PortalShell
      brand="Admin"
      groups={ADMIN_NAV}
      roots={["/a"]}
      userLabel={userEmail ?? ""}
      signOutAction={signOut}
      topRight={
        <Link
          href="/"
          className="text-muted-foreground transition-colors hover:text-foreground"
        >
          View site
        </Link>
      }
    >
      {children}
    </PortalShell>
  )
}
