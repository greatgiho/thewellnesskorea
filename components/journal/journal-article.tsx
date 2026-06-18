import Image from "next/image"
import Link from "next/link"
import type { JournalPostRow } from "@/lib/journal/types"
import { journalCategoryLabel } from "@/lib/journal/copy"

type JournalArticleProps = {
  post: JournalPostRow
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  })
}

function renderBody(body: string) {
  return body.split(/\n\n+/).map((block, index) => {
    const trimmed = block.trim()
    if (!trimmed) return null

    if (trimmed.startsWith("> ")) {
      const quote = trimmed.replace(/^>\s?/gm, "")
      return (
        <blockquote
          key={index}
          className="border-l-2 border-primary/30 pl-6 font-serif text-xl font-light italic leading-relaxed text-foreground/90"
        >
          {quote}
        </blockquote>
      )
    }

    if (trimmed.startsWith("## ")) {
      return (
        <h2
          key={index}
          className="mt-10 font-serif text-3xl font-light text-foreground"
        >
          {trimmed.replace(/^##\s/, "")}
        </h2>
      )
    }

    return (
      <p key={index} className="leading-relaxed text-foreground/90">
        {trimmed}
      </p>
    )
  })
}

export function JournalArticle({ post }: JournalArticleProps) {
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

      {post.hero_image_path ? (
        <div className="relative mt-10 aspect-[16/10] overflow-hidden rounded-2xl">
          <Image
            src={post.hero_image_path}
            alt=""
            fill
            priority
            sizes="(max-width: 768px) 100vw, 768px"
            className="object-cover"
          />
        </div>
      ) : null}

      <div className="prose-spacing mt-12 space-y-6 text-base">{renderBody(post.body_en)}</div>
    </article>
  )
}
