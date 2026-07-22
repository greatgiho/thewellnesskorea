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
      "보기 전용(view-as) 상태에서는 변경할 수 없습니다. 먼저 'View-as 종료'를 눌러주세요.",
    )
  }
}
