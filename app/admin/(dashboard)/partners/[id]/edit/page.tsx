import { notFound } from "next/navigation"
import { PartnerForm } from "@/components/admin/partner-form"
import { PartnerReviewPanel } from "@/components/admin/partner-review-panel"
import { PartnerAccountPanel } from "@/components/admin/partner-account-panel"
import { DeletePartnerButton } from "@/components/admin/delete-partner-button"
import { getPartnerById } from "@/lib/partners/queries"
import { getRegionsForForms } from "@/lib/regions/queries"

type Props = {
  params: Promise<{ id: string }>
}

export default async function EditPersonPage({ params }: Props) {
  const { id } = await params
  const [person, regions] = await Promise.all([
    getPartnerById(id),
    getRegionsForForms(),
  ])
  if (!person) notFound()

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="font-serif text-3xl font-light text-foreground">Edit person</h1>
          <p className="mt-1 text-sm text-muted-foreground">{person.name_en}</p>
        </div>
        <DeletePartnerButton id={person.id} name={person.name_en} />
      </div>
      <PartnerReviewPanel person={person} />
      <PartnerAccountPanel person={person} />
      <PartnerForm person={person} regions={regions} />
    </div>
  )
}
