import { createServiceClient } from "@/lib/supabase/service"
import { siteOrigin } from "@/lib/apply/config"
import { sendResendEmail } from "@/lib/notifications/resend"
import { renderWaitlistAvailableEmail } from "@/lib/notifications/email-templates"

type WaitlistEntry = {
  id: string
  guest_name: string
  guest_email: string
}

type SessionInfo = {
  sessionTitle: string
  heading: string
  timeRange: string
  sessionId: string
}

/**
 * Fetches un-notified waitlist entries for a session (marks them notified atomically),
 * then sends each one a "spot available" email.
 *
 * Safe to call after any cancellation — no-ops if the waitlist is empty.
 */
export async function notifyWaitlist(session: SessionInfo): Promise<void> {
  const supabase = createServiceClient()

  const { data: rawEntries, error } = await supabase
    .rpc("get_waitlist_entries_to_notify", { p_session_id: session.sessionId })

  if (error) {
    console.error("[waitlist] failed to fetch entries:", error.message)
    return
  }

  const entries = (rawEntries ?? []) as WaitlistEntry[]
  if (entries.length === 0) return

  const bookUrl = `${siteOrigin()}/book/${session.sessionId}`

  const results = await Promise.allSettled(
    entries.map(async (entry) => {
      const html = await renderWaitlistAvailableEmail({
        guestName: entry.guest_name,
        sessionTitle: session.sessionTitle,
        heading: session.heading,
        timeRange: session.timeRange,
        bookUrl,
      })

      await sendResendEmail(
        entry.guest_email,
        `[TWK] A spot opened up in ${session.sessionTitle}`,
        html,
        "waitlist-available",
      )
    }),
  )

  const failed = results.filter((r) => r.status === "rejected")
  if (failed.length > 0) {
    console.error(`[waitlist] ${failed.length}/${entries.length} emails failed`)
  } else {
    console.log(`[waitlist] notified ${entries.length} entries for session ${session.sessionId}`)
  }
}
