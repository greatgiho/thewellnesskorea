import type {
  ReferralLink,
  ReferralSession,
  Referrer,
} from "@/lib/referrals/queries"
import type { ReferralTally } from "@/lib/referrals/tally"
import {
  formatSessionWhen,
  qrDateStamp,
  qrFilename,
  referralLink,
  sessionPath,
} from "@/lib/referrals/links"
import { siteOrigin } from "@/lib/site-origin"
import { ReferralLinkRow } from "@/components/referrals/referral-link-row"
import { ReferrerPicker } from "@/components/referrals/referrer-picker"
import { DeleteReferralLinkButton } from "@/components/referrals/delete-referral-link-button"

/**
 * One class, and everyone posting it.
 *
 * The class is the unit because that is how the decision is actually made:
 * a class is scheduled, and then somebody works out who to ask to spread it.
 * Building it the other way round — a partner, then their links — read as an
 * address book and made the common case the long way round.
 */
export function ReferralSessionCard({
  session,
  links,
  referrers,
  tallies,
  choices,
}: {
  session: ReferralSession
  links: ReferralLink[]
  /** Every referrer, active or not — a retired one still owns past links. */
  referrers: Map<string, Referrer>
  tallies: Map<string, ReferralTally>
  /** Active referrers not already on this class. */
  choices: Referrer[]
}) {
  const plain = new URL(sessionPath(session.id), siteOrigin()).toString()

  return (
    <section className="rounded-3xl border border-border bg-card p-6 sm:p-8">
      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <h3 className="font-serif text-xl text-foreground">{session.title}</h3>
        <span className="text-sm text-muted-foreground">
          {formatSessionWhen(session.startsAt)}
        </span>
        {session.isCancelled ? (
          <span className="rounded-full bg-destructive/10 px-2 py-0.5 text-xs text-destructive">
            취소됨
          </span>
        ) : !session.isPublished ? (
          <span className="rounded-full bg-secondary px-2 py-0.5 text-xs text-muted-foreground">
            예약 불가
          </span>
        ) : !session.isListed ? (
          <span className="rounded-full bg-secondary px-2 py-0.5 text-xs text-muted-foreground">
            비공개 — 링크로만
          </span>
        ) : null}
      </div>

      <p className="mt-1 break-all font-mono text-xs text-muted-foreground">
        {plain}
      </p>

      {links.length === 0 ? (
        <p className="mt-5 text-sm text-muted-foreground">
          이 수업을 소개할 사람이 아직 없습니다.
        </p>
      ) : (
        <ul className="mt-5 space-y-3">
          {links.map((link) => {
            const referrer = referrers.get(link.referrerId)
            if (!referrer) return null
            return (
              <ReferralLinkRow
                key={link.id}
                link={referralLink(referrer.code, link.path)}
                filename={qrFilename(
                  referrer.code,
                  session.title,
                  qrDateStamp(session.startsAt),
                )}
                who={
                  <>
                    {referrer.name}
                    <span className="ml-2 font-mono text-xs text-muted-foreground">
                      {referrer.code}
                    </span>
                    {!referrer.isActive ? (
                      <span className="ml-2 text-xs text-muted-foreground">
                        비활성
                      </span>
                    ) : null}
                  </>
                }
                label={link.label}
                tally={tallies.get(referrer.code.toLowerCase())}
                actions={<DeleteReferralLinkButton id={link.id} />}
              />
            )
          })}
        </ul>
      )}

      <div className="mt-5">
        <ReferrerPicker sessionId={session.id} choices={choices} />
      </div>
    </section>
  )
}
