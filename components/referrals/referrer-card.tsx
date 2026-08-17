import type { Referrer } from "@/lib/referrals/queries"
import type { ReferralTotals } from "@/lib/referrals/tally"
import { formatMoney, type Money } from "@/lib/payments/money"
import { referralLink } from "@/lib/referrals/links"
import { ReferrerToggle } from "@/components/referrals/referrer-toggle"
import { CopyLinkButton } from "@/components/referrals/copy-link-button"

/**
 * One referrer in the roster: who they are, and what they are owed in total.
 *
 * The per-class detail lives on the class cards above. This is the settlement
 * line — everything one partner brought in, across every class, which is the
 * number that gets paid against.
 */
export function ReferrerCard({
  referrer,
  totals,
}: {
  referrer: Referrer
  totals: ReferralTotals | undefined
}) {
  // Their code on the front page. Not a QR: this is the one someone puts in an
  // Instagram bio, where it is pasted rather than scanned.
  const base = referralLink(referrer.code)

  return (
    <div
      className={`rounded-2xl border p-5 ${
        referrer.isActive
          ? "border-border/70"
          : "border-dashed border-border bg-muted/30"
      }`}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm text-foreground">
            {referrer.name}
            <span className="ml-2 font-mono text-xs text-muted-foreground">
              {referrer.code}
            </span>
            {!referrer.isActive ? (
              <span className="ml-2 text-xs text-muted-foreground">비활성</span>
            ) : null}
          </p>
          {referrer.note ? (
            <p className="mt-1 max-w-md text-xs text-muted-foreground">
              {referrer.note}
            </p>
          ) : null}
        </div>
        <ReferrerToggle id={referrer.id} isActive={referrer.isActive} />
      </div>

      <p className="mt-3 break-all font-mono text-xs text-muted-foreground">
        {base}
      </p>
      <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1">
        <CopyLinkButton link={base} />
        <p className="text-xs text-muted-foreground">
          <span className="text-foreground">
            확정 {totals?.confirmed ?? 0}건
          </span>
          {totals && totals.total !== totals.confirmed
            ? ` (전체 ${totals.total}건)`
            : null}
          {totals?.revenue.length ? (
            <>
              {" · "}
              {totals.revenue.map((m) => formatMoney(m as Money)).join(", ")}
            </>
          ) : null}
        </p>
      </div>
    </div>
  )
}
