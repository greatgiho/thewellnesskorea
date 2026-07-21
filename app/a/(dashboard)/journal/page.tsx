import { AdminJournalList } from "@/components/admin/admin-journal-list"
import { getAllJournalPostsAdmin } from "@/lib/journal/admin-queries"

export default async function AdminJournalPage() {
  const posts = await getAllJournalPostsAdmin()

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-serif text-3xl font-light text-foreground">Journal</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Platform stories — philosophy, regions, taste, Spaces, and news
        </p>
      </div>
      <AdminJournalList posts={posts} />
    </div>
  )
}
