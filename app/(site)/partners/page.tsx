import type { Metadata } from "next"
import { People } from "@/components/redesign/people"
import { getPublishedPartners } from "@/lib/partners/queries"
import { socialMetadata } from "@/lib/seo/metadata"

export const metadata: Metadata = socialMetadata({
  title: "함께하는 사람들",
  pageTitle: "함께하는 사람들 — The Wellness Korea",
  description:
    "브릭웰 서촌에서 클래스를 이끄는 웰니스 가이드와, 이 공간에 맥박을 더하는 아티스트들입니다.",
  path: "/partners",
})

/**
 * Where the roster lives now.
 *
 * It was a homepage section until the classes were moved forward, and it was
 * also the only route into /partners/[slug] from anywhere on the public site.
 * Deleting it would have left every profile reachable only by a link somebody
 * had already been given, so it got a page instead — the footer's People entry
 * points here, and /partners/<slug> finally has a parent.
 *
 * The whole page is one component because the roster is the whole page. There
 * is no hero and no surrounding copy: someone arriving here has already been
 * told what this is by the link they followed.
 */
export default async function PartnersPage() {
  const [guides, artists] = await Promise.all([
    getPublishedPartners("guide"),
    getPublishedPartners("artist"),
  ])

  return (
    <main>
      <People guides={guides} artists={artists} />
    </main>
  )
}
