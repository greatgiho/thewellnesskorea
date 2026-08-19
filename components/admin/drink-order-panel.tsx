import { QrBlock } from "@/components/referrals/qr-block"
import { AutoRefresh } from "@/components/admin/auto-refresh"
import { DrinkOrderStatusBadge } from "@/components/admin/drink-order-status"
import { qrFilename } from "@/lib/referrals/links"
import { drinkOrderUrl, type DrinkOrder } from "@/lib/drinks/orders"
import { formatMoney } from "@/lib/payments/money"
import { formatKstDateTime } from "@/lib/time/kst"

/**
 * The QR for one rung-up drink, on the screen the customer is shown.
 *
 * The name is the largest thing here because it is what the barista is about
 * to call out, and what tells two QRs apart when the queue is three deep.
 *
 * It polls only while the order is pending. Once it is paid there is nothing
 * left to wait for, and a screen that keeps refreshing all evening is a screen
 * that refreshes while someone is reading it.
 */
export async function DrinkOrderPanel({ order }: { order: DrinkOrder }) {
  const url = drinkOrderUrl(order.id)

  return (
    <section className="rounded-3xl border border-border bg-card p-6 sm:p-8">
      {order.status === "pending" ? <AutoRefresh /> : null}

      <div className="flex flex-wrap items-baseline gap-3">
        <h2 className="font-serif text-2xl text-foreground">{order.nickname}</h2>
        <DrinkOrderStatusBadge status={order.status} />
      </div>
      <p className="mt-1 text-sm text-muted-foreground">
        {order.itemName} · {formatMoney(order.price)} ·{" "}
        {formatKstDateTime(order.createdAt)}
      </p>

      {order.status === "pending" ? (
        <div className="mt-6 flex flex-col gap-6 sm:flex-row sm:items-start">
          <QrBlock
            link={url}
            filename={qrFilename("음료", order.nickname)}
            size="lg"
          />
          <p className="min-w-0 break-all font-mono text-xs text-muted-foreground">
            {url}
          </p>
        </div>
      ) : null}
    </section>
  )
}
