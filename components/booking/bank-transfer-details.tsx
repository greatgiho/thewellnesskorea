import { formatMoney, type Money } from "@/lib/payments/money"
import type { BankInfo } from "@/lib/site/settings"

/**
 * Where to send the money, and under what name.
 *
 * Presentational on purpose. The confirmation page reads site_settings on the
 * server and wraps this (BankTransferNotice); the booking form is a client
 * component and gets the same details handed down as a prop. Two copies of an
 * account number laid out two ways is how one of them ends up a digit short.
 *
 * The amount is repeated here rather than left to the summary above. A
 * transfer is typed by hand into a banking app, on a different screen, and the
 * figure is the second thing that has to survive the trip.
 *
 * The instruction about the depositor's name is not conditional. A transfer
 * arrives as a name and an amount and nothing else — if the name is not the
 * one on the booking, matching it up is manual, and on a busy day it is late.
 * That sentence is the only thing standing between us and that, so it prints
 * whether or not we happen to know the name yet.
 */
export function BankTransferDetails({
  bank,
  amount,
  listAmount,
  discount,
  reference,
}: {
  bank: BankInfo
  amount: Money
  /**
   * The total before a coupon, shown struck through beside it.
   *
   * Only when there is a discount to explain. A price that dropped with no
   * reason on screen is a price somebody rings up to ask about, and the answer
   * has to arrive before they transfer the wrong figure.
   */
  listAmount?: Money | null
  discount?: Money | null
  /** The name the booking is under, once it is known. */
  reference?: string
}) {
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
          <dd className="text-foreground">
            {listAmount ? (
              <span className="mr-2 text-muted-foreground line-through">
                {formatMoney(listAmount)}
              </span>
            ) : null}
            <span className="font-medium">{formatMoney(amount)}</span>
          </dd>
        </div>
        {discount ? (
          <div className="flex gap-2">
            <dt className="text-muted-foreground">쿠폰 할인</dt>
            <dd className="text-foreground">−{formatMoney(discount)}</dd>
          </div>
        ) : null}
        {reference ? (
          <div className="flex gap-2">
            <dt className="text-muted-foreground">입금자명</dt>
            <dd className="font-medium text-foreground">{reference}</dd>
          </div>
        ) : null}
      </dl>
      <p className="mt-4 text-sm text-foreground">
        <strong className="font-medium">입금자명은 반드시 예약자 이름으로</strong>{" "}
        해 주세요. 이름이 다르면 입금 확인이 늦어지고, 확인되지 않으면 예약이
        유지되지 않을 수 있습니다.
      </p>
    </div>
  )
}
