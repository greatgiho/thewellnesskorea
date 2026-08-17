import { referralQrSvg } from "@/lib/referrals/queries"
import { QrFigure } from "@/components/referrals/qr-figure"

/**
 * A QR, rendered to SVG on the server, with SVG and PNG downloads under it.
 *
 * White background regardless of theme: this gets printed, and a dark-mode QR
 * on white paper is a QR that does not scan.
 *
 * `filename` is what the file is called once it leaves here. Worth passing
 * properly — the folder these land in fills up fast, and a QR you cannot
 * identify is a QR you reprint.
 */
export async function QrBlock({
  link,
  filename,
  size = "sm",
}: {
  link: string
  filename: string
  size?: "sm" | "lg"
}) {
  const qr = await referralQrSvg(link)

  return (
    <QrFigure filename={filename} size={size}>
      <div dangerouslySetInnerHTML={{ __html: qr }} />
    </QrFigure>
  )
}
