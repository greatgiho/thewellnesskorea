import Link from "next/link"
import { notFound } from "next/navigation"
import { PartnerDetailView } from "@/components/admin/partner-detail-view"
import { getPartnerById } from "@/lib/partners/queries"
import { getRegionsForForms } from "@/lib/regions/queries"
import { startViewAs } from "@/app/a/view-as-actions"

type Props = {
  params: Promise<{ id: string }>
}

export default async function PersonDetailPage({ params }: Props) {
  const { id } = await params
  const [person, { sido }] = await Promise.all([
    getPartnerById(id),
    getRegionsForForms(),
  ])
  if (!person) notFound()

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Link
            href="/a/partners"
            className="text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
          >
            ← People
          </Link>
          <h1 className="mt-2 font-serif text-3xl font-light text-foreground">
            Profile
          </h1>
        </div>
        <form action={startViewAs.bind(null, "partner", id)}>
          <button
            type="submit"
            className="rounded-full border border-border px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted"
          >
            👁 이 파트너로 보기 (읽기전용)
          </button>
        </form>
      </div>
      <PartnerDetailView person={person} sido={sido} />
    </div>
  )
}
