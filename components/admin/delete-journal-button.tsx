"use client"

import { useState } from "react"
import { deleteJournalPost } from "@/app/admin/journal/actions"

type DeleteJournalButtonProps = {
  postId: string
  title: string
}

export function DeleteJournalButton({ postId, title }: DeleteJournalButtonProps) {
  const [pending, setPending] = useState(false)

  const onDelete = async () => {
    if (
      !confirm(
        `Delete "${title}"? This cannot be undone.`,
      )
    ) {
      return
    }
    setPending(true)
    try {
      await deleteJournalPost(postId)
    } catch {
      setPending(false)
    }
  }

  return (
    <button
      type="button"
      onClick={onDelete}
      disabled={pending}
      className="inline-flex h-9 items-center rounded-lg border border-destructive/40 px-4 text-sm text-destructive hover:bg-destructive/10 disabled:opacity-50"
    >
      {pending ? "Deleting…" : "Delete"}
    </button>
  )
}
