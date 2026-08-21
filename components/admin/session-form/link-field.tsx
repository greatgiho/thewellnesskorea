"use client"

import { CopyLinkButton } from "@/components/referrals/copy-link-button"
import { sessionPath } from "@/lib/referrals/links"
import { siteOrigin } from "@/lib/site-origin"

/**
 * The address of this class, in the dialog where its visibility is decided.
 *
 * Beside the publish and stealth controls, because ticking stealth makes the
 * link the only way in and the question "so where is the link" arrives one
 * second later. Until now the answer was another screen entirely — sign in to
 * 결제, find the session, open it — for a value that is the session id with
 * six characters in front of it.
 *
 * Above the form's fieldset rather than under the checkbox it belongs to. That
 * fieldset disables everything it wraps while merely viewing, and viewing is
 * exactly when somebody wants to copy a link; a copy button that is dead until
 * you press 편집 is the same bug in a nearer place.
 *
 * The plain address, not a referral link: this is handed to the group the
 * private class is for, and nobody is owed a commission on it (see
 * referrals/links). The QR stays on the session page and the counter screen,
 * which are server components and can draw one; a dialog that has to stay
 * interactive gets the text and a copy button, which is what a link is pasted
 * from anyway.
 *
 * Only for a class that exists. A new session has no id, so there is nothing
 * to link to until it is saved.
 */
export function SessionLinkField({ sessionId }: { sessionId: string }) {
  const link = new URL(sessionPath(sessionId), siteOrigin()).toString()

  return (
    <div className="space-y-1.5">
      <p className="text-sm font-medium">예약 링크</p>
      <p className="break-all font-mono text-xs text-muted-foreground">{link}</p>
      <CopyLinkButton link={link} />
    </div>
  )
}
