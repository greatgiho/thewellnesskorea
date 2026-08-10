import { notFound } from "next/navigation"
import { RedesignHome } from "@/components/redesign/home"

// Preview harness for the redesign, kept from when it was not yet the
// homepage. It renders the very same component `/` does, so the two cannot
// drift; it survives only as a stable URL to point people at while `/` is
// still under discussion.
//
// Shown in local dev always; in production mode only when
// ENABLE_DEV_REDESIGN=true. Real Vercel prod leaves the flag unset → 404.
function devRedesignEnabled(): boolean {
  return (
    process.env.NODE_ENV !== "production" ||
    process.env.ENABLE_DEV_REDESIGN === "true"
  )
}

export default async function DevRedesignPage() {
  if (!devRedesignEnabled()) notFound()
  return <RedesignHome />
}
