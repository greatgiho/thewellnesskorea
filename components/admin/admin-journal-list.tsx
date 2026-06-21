"use client"

import Link from "next/link"
import { journalCategoryLabel } from "@/lib/journal/copy"
import type { JournalPostRow } from "@/lib/journal/types"

type AdminJournalListProps = {
  posts: JournalPostRow[]
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  })
}

export function AdminJournalList({ posts }: AdminJournalListProps) {
  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Link
          href="/admin/journal/new"
          className="inline-flex h-9 items-center rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          New post
        </Link>
      </div>

      {posts.length === 0 ? (
        <p className="rounded-lg border border-dashed border-border px-4 py-12 text-center text-sm text-muted-foreground">
          No journal posts yet.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="border-b border-border bg-muted/40 text-muted-foreground">
              <tr>
                <th className="px-4 py-3 font-medium">Title</th>
                <th className="px-4 py-3 font-medium">Category</th>
                <th className="px-4 py-3 font-medium">Published</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium" />
              </tr>
            </thead>
            <tbody>
              {posts.map((post) => (
                <tr key={post.id} className="border-b border-border last:border-0">
                  <td className="px-4 py-3 font-medium text-foreground">
                    {post.title_en}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {journalCategoryLabel(post.category)}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {formatDate(post.published_at)}
                  </td>
                  <td className="px-4 py-3">
                    {post.is_published ? (
                      <span className="text-foreground">Live</span>
                    ) : (
                      <span className="text-muted-foreground">Draft</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      href={`/admin/journal/${post.id}/edit`}
                      className="text-primary hover:underline"
                    >
                      Edit
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
