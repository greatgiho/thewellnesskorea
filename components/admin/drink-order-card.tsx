"use client"

import { QrFigure } from "@/components/referrals/qr-figure"
import { DrinkOrderStatusBadge } from "@/components/admin/drink-order-status"
import { qrFilename } from "@/lib/referrals/links"
import { formatKstDateTime } from "@/lib/time/kst"
import type { DrinkOrderStatus } from "@/lib/drinks/orders"

/**
 * One rung-up drink, as the counter sees it.
 *
 * The name is the largest thing here because it is what the barista is about
 * to call out, and what tells two QRs apart when the queue is three deep.
 *
 * The QR arrives as an SVG string rather than being drawn here, so the same
 * card serves both ways in: the page renders it for a reloaded ?order=, and
 * the ring-up action returns it with the order it just created. One card, so
 * the two cannot drift.
 */

export type CounterOrder = {
  id: string
  nickname: string
  itemName: string
  price: string
  status: DrinkOrderStatus
  createdAt: string
  url: string
  /** Server-rendered. Null once there is nothing left to scan. */
  qrSvg: string | null
}

export function DrinkOrderCard({ order }: { order: CounterOrder }) {
  return (
    <section className="rounded-3xl border border-border bg-card p-6 sm:p-8">
      <div className="flex flex-wrap items-baseline gap-3">
        <h2 className="font-serif text-2xl text-foreground">{order.nickname}</h2>
        <DrinkOrderStatusBadge status={order.status} />
      </div>
      <p className="mt-1 text-sm text-muted-foreground">
        {order.itemName} · {order.price} · {formatKstDateTime(order.createdAt)}
      </p>

      {order.status === "pending" && order.qrSvg ? (
        <div className="mt-6 flex flex-col gap-6 sm:flex-row sm:items-start">
          <QrFigure filename={qrFilename("음료", order.nickname)} size="lg">
            <div dangerouslySetInnerHTML={{ __html: order.qrSvg }} />
          </QrFigure>
          <p className="min-w-0 break-all font-mono text-xs text-muted-foreground">
            {order.url}
          </p>
        </div>
      ) : null}
    </section>
  )
}
