import Link from "next/link"
import { notFound } from "next/navigation"
import { JournalForm } from "@/components/admin/journal-form"
import { DeleteJournalButton } from "@/components/admin/delete-journal-button"
import {
  getJournalPostByIdAdmin,
  getPublishedExperiencesForJournalForm,
} from "@/lib/journal/admin-queries"
import {
  getJournalPartnerIdsForPostAdmin,
  getPartnerOptionsForJournalForm,
} from "@/lib/journal/partners"

type Props = {
  params: Promise<{ id: string }>
}

export default async function AdminJournalEditPage({ params }: Props) {
  const { id } = await params

  let post, experiences, partners, partnerIds
  try {
    ;[post, experiences, partners, partnerIds] = await Promise.all([
      getJournalPostByIdAdmin(id),
      getPublishedExperiencesForJournalForm(),
      getPartnerOptionsForJournalForm(),
      getJournalPartnerIdsForPostAdmin(id),
    ])
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    return (
      <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-6 font-mono text-sm text-destructive whitespace-pre-wrap">
        <strong>Server error (admin debug):</strong>{"\n"}{msg}
      </div>
    )
  }

  if (!post) notFound()

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <Link
            href="/admin/journal"
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            ← Journal
          </Link>
          <h1 className="mt-2 font-serif text-3xl font-light text-foreground">
            Edit post
          </h1>
        </div>
        <DeleteJournalButton postId={post.id} title={post.title_en} />
      </div>
      <JournalForm
        post={post}
        experiences={experiences}
        partners={partners}
        initialPartnerIds={partnerIds}
      />
    </div>
  )
}
