import { referralQrSvg } from "@/lib/referrals/queries"
import type { ReferralTally } from "@/lib/referrals/tally"
import { formatMoney, type Money } from "@/lib/payments/money"
import { CopyLinkButton } from "@/components/referrals/copy-link-button"

/**
 * One referrer on one class: who, the QR they post, and what it brought in.
 *
 * Shared by the admin screen and the read-only /v one so the QR a collaborator
 * sees is byte-for-byte the one an admin handed out. The `actions` slot is
 * where the admin puts its remove button; /v passes nothing and gets a page
 * with no controls on it at all.
 */
export async function ReferralLinkRow({
  link,
  who,
  label,
  tally,
  actions,
}: {
  link: string
  who: React.ReactNode
  label?: string
  tally?: ReferralTally
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
            <div className="text-sm text-foreground">{who}</div>
            {label ? (
              <p className="mt-0.5 text-xs text-muted-foreground">{label}</p>
            ) : null}
          </div>
          {actions}
        </div>

        <p className="mt-2 break-all font-mono text-xs text-muted-foreground">
          {link}
        </p>

        <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1">
          <CopyLinkButton link={link} />
          {tally ? <TallyLine tally={tally} /> : null}
        </div>
      </div>
    </li>
  )
}

/**
 * What this link brought in: confirmed bookings first, then the money.
 *
 * Confirmed rather than total, because a cancelled booking is not something
 * anyone gets paid for — the total is there beside it so the difference is
 * visible rather than quietly dropped.
 */
export function TallyLine({ tally }: { tally: ReferralTally }) {
  return (
    <p className="text-xs text-muted-foreground">
      <span className="text-foreground">예약 {tally.confirmed}건</span>
      {tally.total !== tally.confirmed ? ` (전체 ${tally.total}건)` : null}
      {tally.revenue.length ? (
        <>
          {" · "}
          {tally.revenue
            // Currency arrives from the database as text; formatMoney's union
            // exists to stop a wrong literal being written in code, not to
            // re-check a column that is already constrained.
            .map((m) => formatMoney(m as Money))
            .join(", ")}
        </>
      ) : null}
    </p>
  )
}
