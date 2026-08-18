import type { Metadata } from "next"
import { requireViewerSession } from "@/lib/auth/require-viewer-session"
import { HostPanel } from "@/components/referrals/host-panel"

export const metadata: Metadata = {
  title: "바이럴 호스트 — 레퍼럴",
}

export default async function Page() {
  await requireViewerSession()
  return <HostPanel />
}
