"use client"

import { BeverageOrderStatusBadge } from "@/components/admin/beverage-order-status"
import { formatClockInKst } from "@/lib/time/kst"
import type { CounterOrder } from "@/lib/beverages/counter"

/**
 * One rung-up beverage, as the counter sees it.
 *
 * The name is the largest thing here because it is what the barista is about
 * to call out. It is empty while the QR is still on screen — a nickname is
 * optional and PayPal's name arrives with the money — so until then the price
 * stands in, which is what distinguishes one waiting QR from another anyway.
 *
 * The QR arrives as an SVG string rather than being drawn here. Both ways of
 * putting an order on this card — ringing one up, picking one out of the list
 * — go through toCounterOrder, so there is one shape and one place it is made.
 *
 * No download under it, unlike the referral QRs. Those get printed and stuck
 * to walls; this one is turned round for the person standing there and is
 * worthless a minute later. White background all the same — a dark-mode QR is
 * a QR some phone cameras will not read.
 */

export function BeverageOrderCard({ order }: { order: CounterOrder }) {
  return (
    <section className="rounded-3xl border border-border bg-card p-6 sm:p-8">
      <div className="flex flex-wrap items-baseline gap-3">
        <h2 className="font-serif text-2xl text-foreground">
          {order.name ?? order.itemName}
        </h2>
        <BeverageOrderStatusBadge status={order.status} />
      </div>
      <p className="mt-1 text-sm text-muted-foreground">
        <span className="font-mono text-foreground">{order.code}</span> ·{" "}
        {order.itemName} · {order.price} ·{" "}
        {/* To the second. Two ring-ups a few seconds apart are otherwise
            stamped the same minute, which is no help in telling them apart. */}
        {formatClockInKst(order.createdAt)}
      </p>

      {order.status === "pending" && order.qrSvg ? (
        <div className="mt-6 flex flex-col gap-6 sm:flex-row sm:items-start">
          <div className="w-[220px] shrink-0 rounded-xl bg-white p-2 [&>div]:contents [&_svg]:h-auto [&_svg]:w-full">
            <div dangerouslySetInnerHTML={{ __html: order.qrSvg }} />
          </div>
          <p className="min-w-0 break-all font-mono text-xs text-muted-foreground">
            {order.url}
          </p>
        </div>
      ) : null}
    </section>
  )
}
