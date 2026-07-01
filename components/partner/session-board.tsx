"use client"

import { useState, useTransition } from "react"
import { createSessionPost, deleteSessionPost } from "@/app/partner/session-actions"
import type { SessionPost } from "@/lib/partner/queries"

type Props = {
  sessionId: string
  posts: SessionPost[]
  partnerName: string
}

export function SessionBoard({ sessionId, posts: initialPosts, partnerName }: Props) {
  const [posts, setPosts] = useState(initialPosts)
  const [content, setContent] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    startTransition(async () => {
      const result = await createSessionPost(sessionId, content)
      if (result.ok) {
        setContent("")
        // optimistic update
        setPosts((prev) => [
          ...prev,
          {
            id: crypto.randomUUID(),
            author_type: "teacher",
            author_name: partnerName,
            content: content.trim(),
            created_at: new Date().toISOString(),
          },
        ])
      } else {
        setError(result.error)
      }
    })
  }

  const handleDelete = (postId: string) => {
    if (!confirm("삭제하시겠습니까?")) return
    startTransition(async () => {
      const result = await deleteSessionPost(sessionId, postId)
      if (result.ok) {
        setPosts((prev) => prev.filter((p) => p.id !== postId))
      }
    })
  }

  return (
    <div className="space-y-6">
      {/* 글 목록 */}
      {posts.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border px-6 py-10 text-center text-sm text-muted-foreground">
          아직 작성된 글이 없습니다. 첫 번째 피드백을 남겨보세요.
        </div>
      ) : (
        <div className="space-y-3">
          {posts.map((post) => (
            <div
              key={post.id}
              className={`rounded-2xl border p-5 ${
                post.author_type === "teacher"
                  ? "border-primary/20 bg-primary/5"
                  : "border-border bg-card/40"
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-0.5">
                  <p className="text-xs font-medium text-muted-foreground">
                    {post.author_name}
                    {post.author_type === "teacher" && (
                      <span className="ml-2 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] text-primary">
                        선생님
                      </span>
                    )}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(post.created_at).toLocaleString("ko-KR", {
                      timeZone: "Asia/Seoul",
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
                {post.author_type === "teacher" && (
                  <button
                    type="button"
                    onClick={() => handleDelete(post.id)}
                    disabled={isPending}
                    className="text-xs text-muted-foreground hover:text-destructive"
                  >
                    삭제
                  </button>
                )}
              </div>
              <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-foreground">
                {post.content}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* 글 작성 */}
      <form onSubmit={handleSubmit} className="space-y-3">
        <p className="text-sm font-medium text-foreground">피드백 작성</p>
        {error && (
          <p className="text-sm text-destructive">{error}</p>
        )}
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="수업에 대한 피드백이나 메모를 남겨보세요."
          rows={4}
          className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring/50 resize-none"
        />
        <button
          type="submit"
          disabled={isPending || !content.trim()}
          className="inline-flex h-9 items-center rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
        >
          {isPending ? "작성 중…" : "작성"}
        </button>
      </form>
    </div>
  )
}
