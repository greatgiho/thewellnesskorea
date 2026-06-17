import { notFound } from "next/navigation"
import { PersonForm } from "@/components/admin/person-form"
import { PersonReviewPanel } from "@/components/admin/person-review-panel"
import { DeletePersonButton } from "@/components/admin/delete-person-button"
import { getPersonById } from "@/lib/people/queries"

type Props = {
  params: Promise<{ id: string }>
}

export default async function EditPersonPage({ params }: Props) {
  const { id } = await params
  const person = await getPersonById(id)
  if (!person) notFound()

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="font-serif text-3xl font-light text-foreground">Edit person</h1>
          <p className="mt-1 text-sm text-muted-foreground">{person.name_en}</p>
        </div>
        <DeletePersonButton id={person.id} name={person.name_en} />
      </div>
      <PersonReviewPanel person={person} />
      <PersonForm person={person} />
    </div>
  )
}
