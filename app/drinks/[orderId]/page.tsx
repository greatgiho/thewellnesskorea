import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { PublicShell, PageHeader } from "@/components/redesign/public-shell"
import { DrinkCheckout, DrinkReceiptCard } from "../drink-checkout"
import { getDrinkOrder } from "@/lib/drinks/orders"
import { receiptCode } from "@/lib/drinks/menu"
import { formatMoney } from "@/lib/payments/money"

export const metadata: Metadata = {
  title: "Drinks — The Wellness Korea",
  description: "Pay for your drink at the counter.",
}

// An order changes underneath this page — it is pending when the QR goes up
// and paid a moment later. Cached, a reload would show a paid drink as unpaid
// and invite paying for it twice.
export const dynamic = "force-dynamic"

/**
 * The page behind the QR on the counter screen.
 *
 * Reachable by anyone holding the id, which is the point: the customer is not
 * signed in and never will be. So it shows only what the person standing there
 * already knows — the name they gave and the price they were told.
 *
 * Inside PublicShell rather than bare, because this takes money and 전자상거래법
 * requires the trader details the shell's footer carries.
 */
export default async function DrinkOrderPage({
  params,
}: {
  params: Promise<{ orderId: string }>
}) {
  const { orderId } = await params
  const order = await getDrinkOrder(orderId)
  if (!order) notFound()

  const clientId = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID

  return (
    <PublicShell>
      <PageHeader eyebrow="Counter" title={order.nickname} />
      <main className="mx-auto max-w-md px-6 pb-20 pt-10 lg:pb-28">
        {order.status === "paid" ? (
          <DrinkReceiptCard
            nickname={order.nickname}
            name={order.itemName}
            amount={formatMoney(order.price)}
            code={order.paypalCaptureId ? receiptCode(order.paypalCaptureId) : "—"}
            paidAt={order.paidAt}
          />
        ) : order.status === "refunded" ? (
          <p className="rounded-2xl border border-dashed border-border bg-muted/30 px-4 py-3 text-center text-sm text-muted-foreground">
            This order was refunded.
          </p>
        ) : (
          <div className="space-y-8">
            <p className="text-center font-serif text-5xl font-light text-foreground">
              {formatMoney(order.price)}
            </p>
            <p className="text-center text-sm text-muted-foreground">
              {order.itemName}
            </p>

            {clientId ? (
              <DrinkCheckout
                orderId={order.id}
                clientId={clientId}
                currency={order.price.currency}
              />
            ) : (
              <p className="rounded-2xl border border-dashed border-border bg-muted/30 px-4 py-3 text-sm text-muted-foreground">
                Card payment is unavailable right now. Please pay our staff
                directly.
              </p>
            )}
          </div>
        )}
      </main>
    </PublicShell>
  )
}
