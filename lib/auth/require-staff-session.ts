import { createClient } from "@/lib/supabase/server"

export type StaffRole = "admin" | "partner"

export type StaffSession = {
  userId: string
  role: StaffRole
}

/**
 * The signed-in admin or partner, or null.
 *
 * Deliberately does not redirect. The existing helpers each assume one portal
 * and send everyone else to that portal's sign-in page; check-in is the one
 * screen both roles reach, from a link scanned off a ticket. Bouncing a
 * partner to the admin door would be wrong, and bouncing anyone anywhere loses
 * the ticket they just scanned — /a/signin has no `next` handling, so they
 * would land on a dashboard and have to scan again. The page says what is
 * missing instead, and the URL stays where they can retry it.
 *
 * Whether the caller may check in *this particular* booking is not decided
 * here. That depends on the session, and is enforced in the database by
 * can_check_in_session, so the two callers cannot drift apart.
 */
export async function getStaffSession(): Promise<StaffSession | null> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return null

  const role = user.app_metadata?.role
  if (role !== "admin" && role !== "partner") return null

  return { userId: user.id, role }
}
