import { referralQrSvg, type ReferralLink } from "@/lib/referrals/queries"
import { formatSessionWhen } from "@/lib/referrals/links"
import { CopyLinkButton } from "@/components/admin/copy-link-button"

/**
 * One printable link: what it points at, the QR, and the URL under it.
 *
 * Shared by the admin screen and the read-only /v one so the QR a collaborator
 * sees is byte-for-byte the one an admin printed. The `actions` slot is where
 * the admin puts its delete button; /v passes nothing and gets a page with no
 * controls on it at all.
 */
export async function ReferralLinkRow({
  link,
  target,
  label,
  actions,
}: {
  link: string
  target: React.ReactNode
  label?: string
  actions?: React.ReactNode
}) {
  const qr = await referralQrSvg(link)

  return (
    <li className="flex flex-col gap-4 rounded-2xl border border-border/70 p-4 sm:flex-row">
      <div
        className="w-[112px] shrink-0 self-start rounded-xl bg-white p-2 [&>svg]:h-auto [&>svg]:w-full"
        dangerouslySetInnerHTML={{ __html: qr }}
      />

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div className="min-w-0">
            <div className="text-sm text-foreground">{target}</div>
            {label ? (
              <p className="mt-0.5 text-xs text-muted-foreground">{label}</p>
            ) : null}
          </div>
          {actions}
        </div>

        <p className="mt-2 break-all font-mono text-xs text-muted-foreground">
          {link}
        </p>
        <div className="mt-2">
          <CopyLinkButton link={link} />
        </div>
      </div>
    </li>
  )
}

/** What a saved link points at, in words rather than as a path. */
export function LinkTarget({ link }: { link: ReferralLink }) {
  if (!link.session) {
    // Either the front page, or a class that has since been deleted. The path
    // is the honest answer to both, and it is what the QR actually does.
    return link.path === "/" ? (
      <span>사이트 홈</span>
    ) : (
      <span className="text-muted-foreground">
        없어진 수업 <span className="font-mono">{link.path}</span>
      </span>
    )
  }

  return (
    <span>
      {link.session.title}
      {link.session.isCancelled ? (
        <span className="ml-1.5 text-xs text-destructive">취소된 수업</span>
      ) : null}
      <span className="ml-2 text-xs text-muted-foreground">
        {formatSessionWhen(link.session.startsAt)}
      </span>
    </span>
  )
}
