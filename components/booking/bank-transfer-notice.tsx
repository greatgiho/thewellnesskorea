import { getSiteSettings, hasBankInfo } from "@/lib/site/settings"
import { BankTransferDetails } from "@/components/booking/bank-transfer-details"
import type { Money } from "@/lib/payments/money"

/**
 * The transfer details, for a server component that has a booking id.
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
 * The layout lives in BankTransferDetails, which the booking form renders too
 * from a prop, since a client component cannot await settings of its own.
 */
export async function BankTransferNotice({
  amount,
  listAmount,
  discount,
  reference,
}: {
  amount: Money
  listAmount?: Money | null
  discount?: Money | null
  reference?: string
}) {
  const { bank } = await getSiteSettings()
  if (!hasBankInfo(bank)) return null

  return (
    <BankTransferDetails
      bank={bank}
      amount={amount}
      listAmount={listAmount}
      discount={discount}
      reference={reference}
    />
  )
}
