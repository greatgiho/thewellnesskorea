import { journalCategoryLabel } from "@/lib/journal/copy"
import { journalBodyToHtml } from "@/lib/journal/body"
import type { JournalPartnerTag } from "@/lib/journal/partners"
import { getJournalPhotoUrl } from "@/lib/journal/images"
import type { JournalPostRow } from "@/lib/journal/types"
import { JournalPartnerTags } from "@/components/journal/journal-partner-tags"
import Image from "next/image"
import Link from "next/link"

type JournalArticleProps = {
  post: JournalPostRow
  partners?: JournalPartnerTag[]
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  })
}

export function JournalArticle({ post, partners = [] }: JournalArticleProps) {
  const heroSrc = post.hero_image_path
    ? getJournalPhotoUrl(post.hero_image_path)
    : null
  const bodyHtml = journalBodyToHtml(post.body_en)

  return (
    <article className="mx-auto max-w-3xl px-6 pb-24 pt-32 lg:px-0 lg:pb-32 lg:pt-36">
      <Link
        href="/journal"
        className="font-mono text-xs uppercase tracking-[0.35em] text-primary transition-colors hover:text-foreground"
      >
        Journal
      </Link>
      <h1 className="mt-6 text-balance font-serif text-4xl font-light leading-tight text-foreground sm:text-5xl">
        {post.title_en}
      </h1>
      <p className="mt-5 text-sm text-muted-foreground">
        The Wellness Korea · {formatDate(post.published_at)} ·{" "}
        {post.read_minutes} min read · {journalCategoryLabel(post.category)}
      </p>

      {heroSrc ? (
        <div className="relative mt-10 aspect-[16/10] overflow-hidden rounded-2xl">
          <Image
            src={heroSrc}
            alt=""
            fill
            priority
            sizes="(max-width: 768px) 100vw, 768px"
            className="object-cover"
          />
        </div>
      ) : null}

      {bodyHtml ? (
        <div
          className="journal-body mt-12 text-base"
          dangerouslySetInnerHTML={{ __html: bodyHtml }}
        />
      ) : null}

      <JournalPartnerTags partners={partners} />
    </article>
  )
}
