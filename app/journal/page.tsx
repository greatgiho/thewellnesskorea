import type { Metadata } from "next"
import { Footer } from "@/components/footer"
import { JournalArticle } from "@/components/journal/journal-article"
import { JournalIndex } from "@/components/journal/journal-index"
import { Navbar } from "@/components/navbar"
import { getPublishedJournalPosts } from "@/lib/journal/queries"

export const metadata: Metadata = {
  title: "Journal — The Wellness Korea",
  description:
    "Philosophy, Spaces, programs, and news from The Wellness Korea.",
}

export default async function JournalPage() {
  const posts = await getPublishedJournalPosts()

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main>
        <JournalIndex posts={posts} />
      </main>
      <Footer />
    </div>
  )
}
