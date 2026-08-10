/**
 * The homepage is the v0 redesign — see components/redesign/home.tsx.
 *
 * The sections it drops relative to the old homepage — WhyKorea, Paths, Guides,
 * Artists, and the multi-experience hero carousel — have no equivalent: the
 * redesign is built around the single `brickwell` experience, and its own
 * information architecture (Brickwell / Upcoming / Past) replaces rather than
 * reorganises them. The previous page is kept verbatim at
 * app/page.pre-redesign-backup.tsx, which is not a route.
 */
import { RedesignHome } from "@/components/redesign/home"

export default async function Page() {
  return <RedesignHome />
}
