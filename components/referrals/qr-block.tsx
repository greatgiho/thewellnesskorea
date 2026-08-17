import { referralQrSvg } from "@/lib/referrals/queries"

/**
 * A QR, rendered to SVG on the server.
 *
 * White background regardless of theme: this gets printed, and a dark-mode QR
 * on white paper is a QR that does not scan.
 */
export async function QrBlock({
  link,
  size = "sm",
}: {
  link: string
  size?: "sm" | "lg"
}) {
  const qr = await referralQrSvg(link)

  return (
    <div
      className={`shrink-0 self-start rounded-xl bg-white p-2 [&>svg]:h-auto [&>svg]:w-full ${
        size === "lg" ? "w-[220px]" : "w-[112px]"
      }`}
      dangerouslySetInnerHTML={{ __html: qr }}
    />
  )
}
