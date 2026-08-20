"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"
import { cancelBookingAsAdmin, deleteWaitlistEntryAsAdmin } from "@/app/a/bookings/actions"
import { formatBookingDateTime } from "@/lib/bookings/format"
import { formatMoney, money } from "@/lib/payments/money"
import { OnsitePaymentButton } from "@/components/admin/onsite-payment-button"
import {
  PAYMENT_STATUS_LABEL,
  RefundPaymentButton,
} from "@/components/admin/refund-payment-button"
import { formatOrder } from "@/lib/bookings/lines"
import type { AdminBookingItem } from "@/lib/bookings/admin-queries"
import type { WaitlistEntry } from "@/lib/waitlist/admin-queries"
import { formatKstDateTime } from "@/lib/time/kst"

type SessionBookingDetailProps = {
  sessionId: string
  capacity: number
  bookings: AdminBookingItem[]
  waitlist: WaitlistEntry[]
  /** lower(code) -> partner name, for reading the referral column. */
  referrerNames: Map<string, string>
}

type ConfirmState =
  | { type: "cancel-booking"; bookingId: string; guestName: string }
  | { type: "delete-waitlist"; entryId: string; guestName: string }
  | null

export function SessionBookingDetail({
  capacity,
  bookings,
  waitlist,
  referrerNames,
}: SessionBookingDetailProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [confirm, setConfirm] = useState<ConfirmState>(null)
  const [error, setError] = useState<string | null>(null)

  const confirmedBookings = bookings.filter((b) => b.status === "confirmed")
  const otherBookings = bookings.filter((b) => b.status !== "confirmed")

  const handleConfirm = () => {
    if (!confirm) return
    setError(null)

    startTransition(async () => {
      const result =
        confirm.type === "cancel-booking"
          ? await cancelBookingAsAdmin(confirm.bookingId)
          : await deleteWaitlistEntryAsAdmin(confirm.entryId)

      setConfirm(null)
      if (result.ok) router.refresh()
      else setError(result.error)
    })
  }

  return (
    <>
      <ConfirmDialog
        open={confirm !== null}
        title={
          confirm?.type === "cancel-booking"
            ? `Cancel booking for ${confirm.guestName}?`
            : `Remove ${confirm?.guestName ?? ""} from waitlist?`
        }
        description={
          confirm?.type === "cancel-booking"
            ? "This will cancel the reservation and notify the guest. Any open waitlist entries for this session will also be notified."
            : "This will remove the waitlist entry. The guest will not be notified."
        }
        confirmLabel={confirm?.type === "cancel-booking" ? "Cancel booking" : "Remove"}
        destructive
        onConfirm={handleConfirm}
        onCancel={() => setConfirm(null)}
      />

      {error ? (
        <p className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </p>
      ) : null}

      {/* ── Bookings ── */}
      <section className="space-y-3">
        <div className="flex items-baseline justify-between">
          <h2 className="font-medium text-foreground">
            Reservations
          </h2>
          <span className="text-sm text-muted-foreground">
            {confirmedBookings.length} confirmed / {capacity} capacity
          </span>
        </div>

        {confirmedBookings.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border px-5 py-10 text-center text-sm text-muted-foreground">
            No confirmed bookings yet.
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-border">
            <table className="min-w-full text-sm">
              <thead className="border-b border-border bg-muted/40 text-xs uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 text-left">Guest</th>
                  <th className="px-4 py-3 text-left">Contact</th>
                  <th className="px-4 py-3 text-left">Booked at</th>
                  <th className="px-4 py-3 text-left">Type</th>
                  <th className="px-4 py-3 text-left">레퍼럴</th>
                  <th className="px-4 py-3 text-left">결제</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody>
                {confirmedBookings.map((b, i) => (
                  <tr
                    key={b.id}
                    className={i < confirmedBookings.length - 1 ? "border-b border-border/60" : ""}
                  >
                    <td className="px-4 py-3 font-medium text-foreground">
                      {b.guestName}
                      {/* Seats, not bookings: a roster that lists one name for
                          a family of four does not add up to the class count. */}
                      {b.partySize > 1 || b.childCount > 0 || b.lines.some((l) => l.tierCode) ? (
                        <span className="ml-2 rounded-full border border-border px-2 py-0.5 text-xs font-normal text-muted-foreground">
                          {formatOrder(b.lines)}
                        </span>
                      ) : null}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      <p>{b.guestEmail}</p>
                      {b.guestPhone ? <p className="text-xs">{b.guestPhone}</p> : null}
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">
                      {formatKstDateTime(b.createdAt)}
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">
                      {b.userId ? "Member" : "Guest"}
                    </td>
                    <td className="px-4 py-3 text-xs">
                      <Referral code={b.referralCode} names={referrerNames} />
                    </td>
                    <td className="px-4 py-3 text-xs">
                      {!b.payment ? (
                        <span className="text-muted-foreground">무료</span>
                      ) : b.payment.provider === "onsite" ? (
                        <span className="inline-flex flex-wrap items-center gap-2">
                          <span
                            className={
                              b.payment.status === "paid"
                                ? "text-muted-foreground"
                                : "font-medium text-destructive"
                            }
                          >
                            {formatMoney(money(b.payment.currency, b.payment.amount))}
                            {b.payment.status === "paid" ? " 수령됨" : " 미수령"}
                          </span>
                          <OnsitePaymentButton
                            bookingId={b.id}
                            paid={b.payment.status === "paid"}
                          />
                        </span>
                      ) : (
                        <span className="inline-flex flex-wrap items-center gap-2">
                          <span className="text-muted-foreground">
                            {formatMoney(money(b.payment.currency, b.payment.amount))} ·{" "}
                            {PAYMENT_STATUS_LABEL[b.payment.status] ?? b.payment.status}
                          </span>
                          {/* Only what PayPal can actually give back: settled,
                              and settled through PayPal. Refunding is not
                              cancelling — the seat is let go separately, which
                              is the same separation the customer's own cancel
                              link has always kept from the other side. */}
                          {b.payment.status === "paid" &&
                          b.payment.provider === "paypal" ? (
                            <RefundPaymentButton
                              bookingId={b.id}
                              guestName={b.guestName}
                              amount={formatMoney(
                                money(b.payment.currency, b.payment.amount),
                              )}
                            />
                          ) : null}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        type="button"
                        disabled={isPending}
                        onClick={() =>
                          setConfirm({ type: "cancel-booking", bookingId: b.id, guestName: b.guestName })
                        }
                        className="text-xs font-medium text-destructive hover:underline disabled:opacity-50"
                      >
                        Cancel
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Cancelled / no-show bookings collapsed */}
        {otherBookings.length > 0 && (
          <details className="rounded-xl border border-border">
            <summary className="cursor-pointer select-none px-4 py-3 text-sm text-muted-foreground hover:text-foreground">
              {otherBookings.length} cancelled / no-show
            </summary>
            <div className="border-t border-border">
              <table className="min-w-full text-sm">
                <tbody>
                  {otherBookings.map((b, i) => (
                    <tr key={b.id} className={i < otherBookings.length - 1 ? "border-b border-border/60" : ""}>
                      <td className="px-4 py-3 text-muted-foreground">{b.guestName}</td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">{b.guestEmail}</td>
                      <td className="px-4 py-3 text-xs">
                        <Referral code={b.referralCode} names={referrerNames} />
                      </td>
                      <td className="px-4 py-3">
                        <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                          {b.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </details>
        )}
      </section>

      {/* ── Waitlist ── */}
      <section className="space-y-3">
        <div className="flex items-baseline justify-between">
          <h2 className="font-medium text-foreground">Waitlist</h2>
          <span className="text-sm text-muted-foreground">
            {waitlist.filter((w) => !w.notifiedAt).length} pending
            {waitlist.filter((w) => w.notifiedAt).length > 0
              ? ` · ${waitlist.filter((w) => w.notifiedAt).length} notified`
              : ""}
          </span>
        </div>

        {waitlist.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border px-5 py-10 text-center text-sm text-muted-foreground">
            No waitlist entries.
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-border">
            <table className="min-w-full text-sm">
              <thead className="border-b border-border bg-muted/40 text-xs uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 text-left">Guest</th>
                  <th className="px-4 py-3 text-left">Contact</th>
                  <th className="px-4 py-3 text-left">Joined</th>
                  <th className="px-4 py-3 text-left">Status</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody>
                {waitlist.map((w, i) => (
                  <tr key={w.id} className={i < waitlist.length - 1 ? "border-b border-border/60" : ""}>
                    <td className="px-4 py-3 font-medium text-foreground">{w.guestName}</td>
                    <td className="px-4 py-3 text-muted-foreground">
                      <p>{w.guestEmail}</p>
                      {w.guestPhone ? <p className="text-xs">{w.guestPhone}</p> : null}
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">
                      {formatKstDateTime(w.createdAt)}
                    </td>
                    <td className="px-4 py-3">
                      {w.notifiedAt ? (
                        <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                          Notified
                        </span>
                      ) : (
                        <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs text-primary">
                          Waiting
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        type="button"
                        disabled={isPending}
                        onClick={() =>
                          setConfirm({ type: "delete-waitlist", entryId: w.id, guestName: w.guestName })
                        }
                        className="text-xs font-medium text-destructive hover:underline disabled:opacity-50"
                      >
                        Remove
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </>
  )
}

/**
 * Who brought this booking in.
 *
 * Falls back to the raw code when no referrer matches it. That happens when a
 * referrer row was deleted, and the code is still the truth about what the
 * visitor arrived with — better than an empty cell that reads as "nobody".
 */
function Referral({
  code,
  names,
}: {
  code: string | null
  names: Map<string, string>
}) {
  if (!code) return <span className="text-muted-foreground">—</span>

  const name = names.get(code.toLowerCase())
  return (
    <span className="text-foreground">
      {name ?? code}
      {name ? (
        <span className="ml-1.5 font-mono text-[11px] text-muted-foreground">
          {code}
        </span>
      ) : null}
    </span>
  )
}
