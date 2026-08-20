import { hasBankInfo } from "@/lib/site/settings"
import { getSiteSettings } from "@/lib/site/settings"
import { formatMoney, type Money } from "@/lib/payments/money"

/**
 * Where to send the money, for a booking nothing can charge.
 *
 * Won-priced classes have had no online route since Toss was suspended:
 * onlineProviderFor('KRW') returns null, the booking falls back to "pay at the
 * studio", and the customer leaves with nothing they can act on. An account
 * number is something they can act on tonight.
 *
 * Read straight from site_settings rather than the resolved chain, because
 * there is no sensible fallback for an account number. A blank one means we do
 * not take transfers, and the whole block simply does not render — which is
 * the only safe failure for a field where being wrong sends somebody's money
 * to a stranger.
 *
 * The amount is repeated here on purpose. A transfer is typed by hand into a
 * banking app, away from this page, and the figure is the other thing they
 * have to get right.
 */
export async function BankTransferNotice({
  amount,
  reference,
}: {
  amount: Money
  /** What to put in the transfer memo so a payment can be matched to a booking. */
  reference?: string
}) {
  const { bank } = await getSiteSettings()
  if (!hasBankInfo(bank)) return null

  return (
    <div className="rounded-3xl border border-border bg-card p-6 sm:p-8">
      <p className="font-mono text-xs uppercase tracking-[0.25em] text-muted-foreground">
        무통장입금
      </p>
      <p className="mt-3 font-serif text-2xl font-light text-foreground">
        {bank.bankName} {bank.accountNumber}
      </p>
      <p className="mt-1 text-sm text-muted-foreground">
        예금주 {bank.accountHolder}
      </p>
      <dl className="mt-5 space-y-1 text-sm">
        <div className="flex gap-2">
          <dt className="text-muted-foreground">입금액</dt>
          <dd className="text-foreground">{formatMoney(amount)}</dd>
        </div>
        {reference ? (
          <div className="flex gap-2">
            <dt className="text-muted-foreground">입금자명</dt>
            <dd className="text-foreground">{reference}</dd>
          </div>
        ) : null}
      </dl>
      {reference ? (
        <p className="mt-4 text-sm text-muted-foreground">
          예약자 이름으로 입금해 주세요. 이름이 다르면 확인이 늦어집니다.
        </p>
      ) : null}
    </div>
  )
}
