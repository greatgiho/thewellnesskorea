import { NextResponse, type NextRequest } from "next/server"
import { findBookingByMerchantUid } from "@/lib/bookings/finalize-payment"
import { readTossReturn } from "@/lib/payments/toss-return"

/**
 * Toss's failUrl. A route handler rather than the page itself, for the same
 * reason the success side is one: the app-authenticated flows come back as a
 * form POST, and a page can only answer GET.
 *
 * Nothing to settle here — no money moved and the hold still stands. This
 * turns whatever Toss said into something a person can read, and hands the
 * booking id to the page so it can offer the way back to the payment screen.
 *
 * The user-facing page lives at /book/toss/failed so that this path is free to
 * be a handler.
 */
async function handle(request: NextRequest) {
  const { orderId, code, message } = await readTossReturn(request)

  // Toss identifies the order, not the booking. Resolving it here is what lets
  // the page offer "try again" instead of only "back to the class list".
  const booking = orderId ? await findBookingByMerchantUid(orderId) : null

  const params = new URLSearchParams()
  params.set("message", message ?? "결제가 완료되지 않았습니다.")
  // Not "code": that is Supabase's parameter on this site, and a page
  // carrying one gets mistaken for a magic link (see isPaymentReturnPath).
  if (code) params.set("pgCode", code)
  if (booking) params.set("booking", booking.bookingId)

  return NextResponse.redirect(
    new URL(`/book/toss/failed?${params.toString()}`, request.url),
    // 303: the browser may have arrived by POST, and a 307 would replay it.
    303,
  )
}

export const GET = handle
export const POST = handle
