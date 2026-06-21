import type { SupabaseClient } from "@supabase/supabase-js"
import { JOURNAL_PHOTOS_BUCKET } from "./images"

/** Remove hero + inline images under `{postId}/` in journal-photos. */
export async function removeJournalPostStorage(
  supabase: SupabaseClient,
  postId: string,
  heroPath: string | null | undefined,
): Promise<void> {
  const paths = new Set<string>()

  if (heroPath && !heroPath.startsWith("/")) {
    paths.add(heroPath)
  }

  const { data: topLevel } = await supabase.storage
    .from(JOURNAL_PHOTOS_BUCKET)
    .list(postId, { limit: 100 })

  for (const entry of topLevel ?? []) {
    if (!entry.name || entry.name === ".emptyFolderPlaceholder") continue

    if (entry.id) {
      paths.add(`${postId}/${entry.name}`)
      continue
    }

    const { data: nested } = await supabase.storage
      .from(JOURNAL_PHOTOS_BUCKET)
      .list(`${postId}/${entry.name}`, { limit: 100 })

    for (const file of nested ?? []) {
      if (file.name && file.name !== ".emptyFolderPlaceholder") {
        paths.add(`${postId}/${entry.name}/${file.name}`)
      }
    }
  }

  if (paths.size === 0) return

  await supabase.storage.from(JOURNAL_PHOTOS_BUCKET).remove([...paths])
}
