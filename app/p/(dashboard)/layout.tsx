import { partnerSignOut } from "@/app/p/actions"
import { requirePartnerSession } from "@/lib/auth/require-partner-session"
import { PortalShell } from "@/components/portal/portal-shell"
import { PARTNER_NAV } from "@/lib/portal/nav"
import { ViewAsBanner } from "@/components/view-as-banner"

export default async function PartnerDashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { partner } = await requirePartnerSession()

  return (
    <>
      <ViewAsBanner />
      <PortalShell
        brand="Partner Portal"
        groups={PARTNER_NAV}
        roots={["/p"]}
        userLabel={partner.name_ko}
        signOutAction={partnerSignOut}
      >
        {children}
      </PortalShell>
    </>
  )
}
