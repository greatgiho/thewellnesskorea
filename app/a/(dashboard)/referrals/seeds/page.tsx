import type { Metadata } from "next"
import { requireAdminSession } from "@/lib/auth/require-session"
import { SeedPanel } from "@/components/referrals/seed-panel"

export const metadata: Metadata = {
  title: "바이럴 시드 — 레퍼럴",
}

export default async function Page() {
  await requireAdminSession()
  return <SeedPanel />
}
