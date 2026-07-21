import { partnerSignOut } from "@/app/p/actions"
import { requirePartnerSession } from "@/lib/auth/require-partner-session"
import { PortalShell } from "@/components/portal/portal-shell"
import { PARTNER_NAV } from "@/lib/portal/nav"

export default async function PartnerDashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { partner } = await requirePartnerSession()

  return (
    <PortalShell
      brand="Partner Portal"
      groups={PARTNER_NAV}
      roots={["/p"]}
      userLabel={partner.name_ko}
      signOutAction={partnerSignOut}
    >
      {children}
    </PortalShell>
  )
}
