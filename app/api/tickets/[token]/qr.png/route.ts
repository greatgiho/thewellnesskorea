import QRCode from "qrcode"
import { createServiceClient } from "@/lib/supabase/service"
import { checkInUrl } from "@/lib/bookings/checkin"

/**
 * The ticket QR as a PNG, for the confirmation email.
 *
 * Email cannot use the inline SVG the ticket page renders — Gmail strips SVG,
 * and blocks data: URIs in images — so a hosted PNG at a plain URL is the only
 * form that shows up in an inbox. Which matters: a guest booking has no
 * account, so the email is the one copy of the ticket they keep. A link alone
 * means the ticket only exists while they are online and willing to tap it.
 *
 * Public, because the token is the credential and a mail client cannot present
 * anything else. It admits nobody by itself: check-in still requires a
 * signed-in admin or the session's instructor.
 *
 * 404s on an unknown token rather than drawing whatever it was handed, so this
 * is not a QR generator for arbitrary strings.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ token: string }> },
) {
  const { token } = await params

  const { data } = await createServiceClient()
    .from("bookings")
    .select("id")
    .eq("checkin_token", token)
    .maybeSingle()

  if (!data) return new Response("Not found", { status: 404 })

  const png = await QRCode.toBuffer(checkInUrl(token), {
    type: "png",
    width: 600,
    margin: 1,
    errorCorrectionLevel: "M",
  })

  return new Response(new Uint8Array(png), {
    headers: {
      "content-type": "image/png",
      // The code for a token never changes, and mail clients proxy and cache
      // images anyway. Whether the booking is still valid is answered by the
      // pages this points at, not by the picture.
      "cache-control": "public, max-age=31536000, immutable",
    },
  })
}
