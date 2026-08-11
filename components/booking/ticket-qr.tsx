import { ticketQrSvg } from "@/lib/bookings/checkin"

/**
 * The scannable part of a ticket.
 *
 * Shared by the ticket page and the confirmation screen. The confirmation
 * screen matters more than it looks: a guest booking has no account, so the
 * only other way back to a ticket is the confirmation email — and that email
 * is skipped entirely when BREVO_API_KEY is unset, which is the case on the dev
 * clone. Showing the code here means a guest can screenshot it the moment they
 * book, whatever the mail is doing.
 *
 * Rendered as inline SVG on the server, so no QR library ships to the browser
 * and it stays sharp on whatever screen it is scanned from. The white wrapper
 * is not decoration: a scanner needs the quiet zone light regardless of theme.
 */
export async function TicketQr({ token }: { token: string }) {
  const svg = await ticketQrSvg(token)
  return (
    <div
      className="mx-auto w-full max-w-[280px] rounded-2xl bg-white p-4 [&>svg]:h-auto [&>svg]:w-full"
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  )
}
