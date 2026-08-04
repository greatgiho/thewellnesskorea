import "server-only"

import { cookies } from "next/headers"
import { UserFacingError } from "@/lib/errors"
import {
  VIEW_AS_COOKIE,
  decodeViewAs,
  type ViewAsPayload,
} from "@/lib/view-as"

/** Current view-as impersonation, or null. Reads the signed cookie. */
export async function getViewAs(): Promise<ViewAsPayload | null> {
  const store = await cookies()
  return decodeViewAs(store.get(VIEW_AS_COOKIE)?.value)
}

/**
 * Mutation guard — refuse any write while impersonating. view-as is strictly
 * read-only, so every server action that mutates state must call this first.
 */
export async function assertNotViewAs(): Promise<void> {
  if (await getViewAs()) {
    throw new UserFacingError(
      // The quoted label is the banner button, which stays Korean.
      "You can't make changes while viewing as someone else. Press 'View-as 종료' first.",
    )
  }
}
