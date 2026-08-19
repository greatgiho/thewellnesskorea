import type { Metadata } from "next"
import { requireAdminSession } from "@/lib/auth/require-session"
import { QrBlock } from "@/components/referrals/qr-block"
import { CopyLinkButton } from "@/components/referrals/copy-link-button"
import { qrFilename } from "@/lib/referrals/links"
import { DEFAULT_DRINK_ID, drinksLink, findDrink } from "@/lib/drinks/menu"
import { formatMoney } from "@/lib/payments/money"

export const metadata: Metadata = {
  title: "음료 QR",
}

/**
 * The QR to print and put on the counter.
 *
 * Not under 레퍼럴 even though it borrows that screen's QR block: nothing here
 * carries a referral code and nobody is owed anything for it. It is a price
 * list with a way to pay, which makes it 결제.
 */
export default async function Page() {
  await requireAdminSession()

  const drink = findDrink(DEFAULT_DRINK_ID)
  const link = drinksLink()

  return (
    <section className="rounded-3xl border border-border bg-card p-6 sm:p-8">
      <h2 className="font-serif text-xl text-foreground">음료 QR</h2>
      {drink ? (
        <p className="mt-2 text-sm text-muted-foreground">
          {drink.name} · {formatMoney(drink.price)}
        </p>
      ) : null}

      <div className="mt-6 flex flex-col gap-6 sm:flex-row sm:items-start">
        <QrBlock link={link} filename={qrFilename("음료")} size="lg" />
        <div className="min-w-0">
          <p className="break-all font-mono text-sm text-foreground">{link}</p>
          <div className="mt-3">
            <CopyLinkButton link={link} />
          </div>
        </div>
      </div>
    </section>
  )
}
