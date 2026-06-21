import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { Footer } from "@/components/footer"
import { JournalArticle } from "@/components/journal/journal-article"
import { Navbar } from "@/components/navbar"
import { getPublishedJournalPostBySlug } from "@/lib/journal/queries"
import { getJournalPartnerTagsForPost } from "@/lib/journal/partners"

type Props = {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const post = await getPublishedJournalPostBySlug(slug)

  if (!post) {
    return { title: "Journal — The Wellness Korea" }
  }

  return {
    title: post.seo_title ?? `${post.title_en} — The Wellness Korea`,
    description: post.seo_description ?? post.excerpt_en,
  }
}

export default async function JournalArticlePage({ params }: Props) {
  const { slug } = await params
  const post = await getPublishedJournalPostBySlug(slug)

  if (!post) notFound()

  const partners = await getJournalPartnerTagsForPost(post.id)

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main>
        <JournalArticle post={post} partners={partners} />
      </main>
      <Footer />
    </div>
  )
}
