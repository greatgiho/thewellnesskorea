import { PartnerForm } from "@/components/admin/partner-form"
import { getRegionsForForms } from "@/lib/regions/queries"

export default async function NewPersonPage() {
  const regions = await getRegionsForForms()

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-serif text-3xl font-light text-foreground">New person</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Add a wellness guide or artist profile
        </p>
      </div>
      <PartnerForm regions={regions} />
    </div>
  )
}
