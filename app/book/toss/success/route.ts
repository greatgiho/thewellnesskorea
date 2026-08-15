import { NextResponse, type NextRequest } from "next/server"
import { revalidatePath } from "next/cache"
import { settleTossRedirect } from "@/lib/bookings/toss-settlement"
import { isTossConfigured } from "@/lib/payments/toss"

/**
 * Where Toss sends the customer's browser after they authorise a payment.
 *
 * A route handler rather than a page because nothing here is worth rendering:
 * it charges the card and sends the reader on to the confirmation they were
 * always going to see. A page would flash an empty screen while doing the same
 * work, and would do it again on a refresh.
 *
 * No money has moved when this is reached. The authorisation expires by itself
 * if the confirm never runs, so a customer who closes the tab on the way back
 * is not charged — which is also why this must not be slow or clever.
 */
export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams
  const paymentKey = params.get("paymentKey")
  const orderId = params.get("orderId")
  const amount = Number(params.get("amount"))

  const fail = (message: string, code?: string, bookingId?: string) =>
    NextResponse.redirect(
      new URL(
        `/book/toss/fail?message=${encodeURIComponent(message)}` +
          (code ? `&code=${encodeURIComponent(code)}` : "") +
          (bookingId ? `&booking=${encodeURIComponent(bookingId)}` : ""),
        request.url,
      ),
    )

  // Reachable with the secret key missing — the button only needs the public
  // one, so a half-configured deployment sends people here and then throws
  // where nobody can read it.
  if (!isTossConfigured()) {
    return fail("결제 설정이 완료되지 않았습니다. 잠시 후 다시 시도해 주세요.")
  }

  if (!paymentKey || !orderId || !Number.isFinite(amount)) {
    return fail("결제 정보가 올바르지 않습니다.")
  }

  const result = await settleTossRedirect({ paymentKey, orderId, amount })

  if (!result.ok) {
    return fail(result.reason, result.code, result.bookingId)
  }

  revalidatePath("/")

  if (result.status === "awaiting_deposit") {
    return NextResponse.redirect(
      new URL(
        `/book/toss/pending?booking=${encodeURIComponent(result.bookingId)}`,
        request.url,
      ),
    )
  }

  return NextResponse.redirect(
    new URL(
      `/book/confirm?booking=${encodeURIComponent(result.bookingId)}`,
      request.url,
    ),
  )
}
