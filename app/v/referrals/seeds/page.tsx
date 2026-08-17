import type { Metadata } from "next"
import { requireViewerSession } from "@/lib/auth/require-viewer-session"
import { SeedPanel } from "@/components/referrals/seed-panel"

export const metadata: Metadata = {
  title: "바이럴 시드 — 레퍼럴",
}

export default async function Page() {
  await requireViewerSession()
  return <SeedPanel />
}
