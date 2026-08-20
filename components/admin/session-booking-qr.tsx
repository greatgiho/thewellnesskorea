import { QrBlock } from "@/components/referrals/qr-block"
import { CopyLinkButton } from "@/components/referrals/copy-link-button"
import { qrFilename, sessionPath } from "@/lib/referrals/links"
import { siteOrigin } from "@/lib/site-origin"
import { onlineProviderFor } from "@/lib/payments/money"
import type { Currency } from "@/lib/schedule/types"

/**
 * The class's own QR: hold up the screen, and whoever scans it books and pays.
 *
 * Nothing new behind it. /book/<id> has always been a public page that takes
 * a name and a card, so this is only the missing half — a way for whoever is
 * standing at the door to put that address in front of somebody. The same QR
 * every time, so it can equally be printed and left on a counter.
 *
 * Deliberately not per booking. A QR made for one reservation is one more
 * payment path to keep in step with this one, and this one already books the
 * seat, sends the ticket and counts against capacity.
 *
 * Shown only when scanning it would actually lead somewhere that can take
 * money. The booking page requires a confirmed, published, future class, and
 * a processor that handles its currency — with Toss suspended that means USD.
 * A QR that ends at "pay our staff" is worse than no QR, because somebody has
 * already been asked to get their phone out.
 */

export type SessionQrSubject = {
  id: string
  title: string
  status: string
  isPublished: boolean
  startsAt: string
  currency: Currency
  amount: number
}

/** Why this class cannot be sold from a QR, or null when it can. */
export function sessionQrBlocker(session: SessionQrSubject): string | null {
  if (session.status !== "confirmed") return "확정된 수업만 QR로 판매할 수 있습니다."
  if (!session.isPublished) return "공개된 수업만 QR로 판매할 수 있습니다."
  if (new Date(session.startsAt) <= new Date()) return "이미 시작한 수업입니다."
  if (session.amount <= 0) return "무료 수업은 결제할 것이 없습니다."
  if (!onlineProviderFor(session.currency)) {
    return "원화는 온라인 결제를 받을 수 없습니다. 토스 재심사 후에 열립니다."
  }
  return null
}

export function SessionBookingQr({ session }: { session: SessionQrSubject }) {
  const blocker = sessionQrBlocker(session)
  const link = new URL(sessionPath(session.id), siteOrigin()).toString()

  return (
    <section className="rounded-2xl border border-border bg-card p-6">
      <h2 className="font-serif text-lg text-foreground">결제 QR</h2>

      {blocker ? (
        <p className="mt-2 text-sm text-muted-foreground">{blocker}</p>
      ) : (
        <div className="mt-4 flex flex-col gap-6 sm:flex-row sm:items-start">
          <QrBlock
            link={link}
            filename={qrFilename("수업", session.title)}
            size="lg"
          />
          <div className="min-w-0">
            <p className="break-all font-mono text-sm text-foreground">{link}</p>
            <div className="mt-3">
              <CopyLinkButton link={link} />
            </div>
          </div>
        </div>
      )}
    </section>
  )
}
