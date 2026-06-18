import Link from "next/link"
import Image from "next/image"
import type { JournalCardData } from "@/lib/journal/types"
import { journalCategoryLabel } from "@/lib/journal/copy"

type JournalCardProps = {
  post: JournalCardData
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  })
}

export function JournalCard({ post }: JournalCardProps) {
  return (
    <article className="group">
      <Link href={`/journal/${post.slug}`} className="block">
        <div className="relative aspect-[16/10] overflow-hidden rounded-2xl bg-muted">
          {post.heroImage ? (
            <Image
              src={post.heroImage}
              alt=""
              fill
              sizes="(max-width: 768px) 100vw, 400px"
              className="object-cover transition-transform duration-700 group-hover:scale-105"
            />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-stone-200 to-stone-300" />
          )}
        </div>
        <div className="mt-5">
          <p className="font-mono text-xs uppercase tracking-[0.25em] text-primary">
            {journalCategoryLabel(post.category)}
          </p>
          <h2 className="mt-2 font-serif text-2xl font-light leading-snug text-foreground transition-colors group-hover:text-primary">
            {post.title}
          </h2>
          <p className="mt-3 line-clamp-2 text-sm leading-relaxed text-muted-foreground">
            {post.excerpt}
          </p>
          <p className="mt-4 text-xs text-muted-foreground">
            {formatDate(post.publishedAt)} · {post.readMinutes} min read
          </p>
        </div>
      </Link>
    </article>
  )
}
