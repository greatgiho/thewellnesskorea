import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { PublicShell, PageHeader } from "@/components/redesign/public-shell"
import { DrinkCheckout } from "./drink-checkout"
import { DEFAULT_DRINK_ID, findDrink } from "@/lib/drinks/menu"
import { formatMoney } from "@/lib/payments/money"

export const metadata: Metadata = {
  title: "Drinks — The Wellness Korea",
  description: "Pay for a drink at the counter.",
}

/**
 * The page behind the QR on the counter.
 *
 * Inside PublicShell rather than bare, because this takes money and 전자상거래법
 * requires the trader details that the shell's footer carries. The nav above it
 * is the cost of that; while the site is locked pre-launch those links land on
 * the unlock screen, which is untidy but not wrong.
 */
export default async function DrinksPage() {
  const drink = findDrink(DEFAULT_DRINK_ID)
  if (!drink) notFound()

  const clientId = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID

  return (
    <PublicShell>
      <PageHeader eyebrow="Counter" title={drink.name} />
      <main className="mx-auto max-w-md px-6 pb-20 pt-10 lg:pb-28">
        <div className="space-y-8">
          <p className="text-center font-serif text-5xl font-light text-foreground">
            {formatMoney(drink.price)}
          </p>

          {clientId ? (
            <DrinkCheckout
              drinkId={drink.id}
              clientId={clientId}
              currency={drink.price.currency}
            />
          ) : (
            <p className="rounded-2xl border border-dashed border-border bg-muted/30 px-4 py-3 text-sm text-muted-foreground">
              Card payment is unavailable right now. Please pay our staff
              directly.
            </p>
          )}

          <p className="text-center text-sm text-muted-foreground">
            Show the next screen to our staff.
          </p>
        </div>
      </main>
    </PublicShell>
  )
}
