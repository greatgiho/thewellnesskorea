import type { Metadata } from "next"
import { requireViewerSession } from "@/lib/auth/require-viewer-session"
import { PartnerReferralsPanel } from "@/components/referrals/partner-referrals-panel"

export const metadata: Metadata = {
  title: "선생 QR — 레퍼럴",
}

/** `?p=<id>` opens one partner's QR. One at a time, so only one gets drawn. */
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ p?: string }>
}) {
  await requireViewerSession()
  const { p } = await searchParams
  return <PartnerReferralsPanel base="/v/referrals" selectedId={p} />
}
