import Link from "next/link"
import { notFound } from "next/navigation"
import { PersonDetailView } from "@/components/admin/person-detail-view"
import { getPersonById } from "@/lib/people/queries"

type Props = {
  params: Promise<{ id: string }>
}

export default async function PersonDetailPage({ params }: Props) {
  const { id } = await params
  const person = await getPersonById(id)
  if (!person) notFound()

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Link
            href="/admin/people"
            className="text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
          >
            ← People
          </Link>
          <h1 className="mt-2 font-serif text-3xl font-light text-foreground">
            Profile
          </h1>
        </div>
      </div>
      <PersonDetailView person={person} />
    </div>
  )
}
