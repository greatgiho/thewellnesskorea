"use client"

import Image from "next/image"
import Link from "next/link"
import { useLang } from "@/components/redesign/language-provider"
import { Section, SectionHeader } from "@/components/redesign/primitives"
import { InstagramIcon } from "@/components/icons/social-icons"
import { instagramHandle } from "@/lib/partners/utils"
import type { PartnerCardData } from "@/lib/partners/types"

/**
 * The guides and artists, carried over from the pre-redesign homepage.
 *
 * This is not decoration. The old Guides and Artists sections were the only way
 * into /partners/[slug] from anywhere on the public site — drop them and every
 * partner profile becomes an orphan page, reachable only if a journal post
 * happens to tag that person.
 *
 * Both groups live in one section, with #guides and #arts as anchor targets
 * inside it, so links written against the old homepage still land in the right
 * place. The old carousel is replaced by a plain grid: a horizontal scroller
 * hides most of the roster behind a gesture, and there are few enough people
 * that showing them all reads better.
 */
const MAX_PER_GROUP = 8

const T = {
  en: {
    eyebrow: "함께하는 사람들 · People",
    heading: "The people who hold the space",
    lead: "A small group of practitioners and artists — teachers of stillness and movement, and the performers who give the space its pulse.",
    guides: "Wellness guides",
    artists: "Artists",
    empty: "Profiles will appear here once they are published.",
  },
  ko: {
    eyebrow: "함께하는 사람들 · People",
    heading: "공간을 지키는 사람들",
    lead: "고요와 움직임을 가르치는 실천가들, 그리고 이 공간에 맥박을 더하는 예술가들입니다.",
    guides: "웰니스 가이드",
    artists: "아티스트",
    empty: "공개된 프로필이 아직 없습니다.",
  },
}

function PersonGrid({
  anchorId,
  title,
  people,
}: {
  anchorId: string
  title: string
  people: PartnerCardData[]
}) {
  return (
    <div className="mt-14">
      <span id={anchorId} className="block h-0 scroll-mt-24" aria-hidden="true" />
      <h3 className="text-sm uppercase tracking-[0.2em] text-[var(--sage)]">
        {title}
      </h3>

      <ul className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {people.slice(0, MAX_PER_GROUP).map((person) => {
          const handle = instagramHandle(person.instagramUrl)
          return (
            <li key={person.id} className="group">
              {/* Instagram sits beside the profile link, not inside it. The
                  old card nested them, and worked around it by making the
                  card a div with role="link" — so the profile was never a
                  real link: invisible to crawlers, unopenable in a new tab. */}
              <Link href={`/partners/${person.slug}`} className="block">
                <div className="relative aspect-[4/5] overflow-hidden rounded-lg">
                  <Image
                    src={person.image || "/placeholder.svg"}
                    alt={`${person.name} — ${person.role}`}
                    fill
                    sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
                    className="object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                </div>
                <p className="mt-3 font-serif text-xl text-foreground">
                  {person.name}
                </p>
                <p className="mt-0.5 text-sm text-muted-foreground text-pretty">
                  {person.role}
                </p>
              </Link>
              {person.instagramUrl && (
                <a
                  href={person.instagramUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-2 inline-flex items-center gap-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground"
                >
                  <InstagramIcon className="size-3.5" />
                  {handle ?? "Instagram"}
                </a>
              )}
            </li>
          )
        })}
      </ul>
    </div>
  )
}

export function People({
  guides,
  artists,
}: {
  guides: PartnerCardData[]
  artists: PartnerCardData[]
}) {
  const { lang } = useLang()
  const t = T[lang]
  const empty = guides.length === 0 && artists.length === 0

  // The section stays on the page when nothing is published, the same way
  // Upcoming and Past do. Sections that vanish on empty data break the
  // plain/muted banding of the ones around them, which is how a page with no
  // content yet ends up looking broken rather than merely empty.
  return (
    <Section id="people">
      <SectionHeader eyebrow={t.eyebrow} heading={t.heading} lead={t.lead} />

      {empty ? (
        <p className="mt-12 text-sm leading-relaxed text-muted-foreground text-pretty">
          {t.empty}
        </p>
      ) : (
        <>
          {guides.length > 0 && (
            <PersonGrid anchorId="guides" title={t.guides} people={guides} />
          )}
          {artists.length > 0 && (
            <PersonGrid anchorId="arts" title={t.artists} people={artists} />
          )}
        </>
      )}
    </Section>
  )
}
