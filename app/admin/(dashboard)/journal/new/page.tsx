import Link from "next/link"
import { JournalForm } from "@/components/admin/journal-form"
import { getPublishedExperiencesForJournalForm } from "@/lib/journal/admin-queries"
import { getPartnerOptionsForJournalForm } from "@/lib/journal/partners"

export default async function AdminJournalNewPage() {
  const [experiences, partners] = await Promise.all([
    getPublishedExperiencesForJournalForm(),
    getPartnerOptionsForJournalForm(),
  ])

  return (
    <div className="space-y-8">
      <div>
        <Link
          href="/admin/journal"
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          ← Journal
        </Link>
        <h1 className="mt-2 font-serif text-3xl font-light text-foreground">
          New post
        </h1>
      </div>
      <JournalForm experiences={experiences} partners={partners} />
    </div>
  )
}
