import { getAllPartnersAdmin } from "@/lib/partners/queries"
import { AdminPartnersList } from "@/components/admin/admin-partners-list"
import { applyLinkForTeachers } from "@/lib/notifications/admin-alerts"

export default async function AdminPartnersPage() {
  const partners = await getAllPartnersAdmin()

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-serif text-3xl font-light text-foreground">Partners</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Wellness guides, artists, and brands
        </p>
      </div>
      <AdminPartnersList partners={partners} applyLink={applyLinkForTeachers()} />
    </div>
  )
}
