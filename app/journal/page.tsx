import type { Metadata } from "next"
import { Footer } from "@/components/footer"
import { JournalView } from "@/components/journal/journal-view"
import { Navbar } from "@/components/navbar"
import { getPublishedJournalPosts } from "@/lib/journal/queries"
import { parseJournalCategoryParam } from "@/lib/journal/types"

export const metadata: Metadata = {
  title: "Journal — The Wellness Korea",
  description:
    "Philosophy, local discovery, taste, Spaces, programs, and news from The Wellness Korea.",
}

type JournalPageProps = {
  searchParams: Promise<{ category?: string }>
}

export default async function JournalPage({ searchParams }: JournalPageProps) {
  const { category: categoryParam } = await searchParams
  const initialCategory = parseJournalCategoryParam(categoryParam)
  const posts = await getPublishedJournalPosts()

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main>
        <JournalView posts={posts} initialCategory={initialCategory} />
      </main>
      <Footer />
    </div>
  )
}
