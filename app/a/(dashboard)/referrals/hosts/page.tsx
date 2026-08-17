import type { Metadata } from "next"
import { requireAdminSession } from "@/lib/auth/require-session"
import { HostPanel } from "@/components/referrals/host-panel"

export const metadata: Metadata = {
  title: "바이럴 호스트 — 레퍼럴",
}

export default async function Page() {
  await requireAdminSession()
  return <HostPanel />
}
