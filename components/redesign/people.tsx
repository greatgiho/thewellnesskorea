"use client"

import { useEffect, useRef, useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { useLang } from "@/components/redesign/language-provider"
import { PeekRow } from "@/components/redesign/peek-row"
import { Section, SectionHeader } from "@/components/redesign/primitives"
import { InstagramIcon } from "@/components/icons/social-icons"
import { instagramHandle } from "@/lib/partners/utils"
import type { PartnerCardData } from "@/lib/partners/types"
import { cn } from "@/lib/utils"

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
 * place.
 *
 * The layout went grid -> sideways-on-mobile -> here. The grid was chosen
 * because the old carousel hid most of the roster behind a gesture with nothing
 * on screen to suggest the gesture. That objection was right, and it is what
 * PeekRow answers: the next card's edge stays visible, so the rest of the list
 * announces itself. On a phone eleven guides stacked vertically is its own kind
 * of hiding — nobody reaches the eleventh either.
 */
const MAX_PER_GROUP = 8

const T = {
  en: {
    eyebrow: "함께하는 사람들 · People",
    heading: "The people who hold the space",
    lead: "A small group of practitioners and artists — teachers of stillness and movement, and the performers who give the space its pulse.",
    guides: "Wellness guides",
    artists: "Artists",
    more: "Read more",
    close: "Close",
    empty: "Profiles will appear here once they are published.",
  },
  ko: {
    eyebrow: "함께하는 사람들 · People",
    heading: "공간을 지키는 사람들",
    lead: "고요와 움직임을 가르치는 실천가들, 그리고 이 공간에 맥박을 더하는 예술가들입니다.",
    guides: "웰니스 가이드",
    artists: "아티스트",
    more: "더 보기",
    close: "닫기",
    empty: "공개된 프로필이 아직 없습니다.",
  },
}


/**
 * One person.
 *
 * The introductions are wildly uneven — three characters for one guide, three
 * hundred for another — and side by side that difference becomes a ragged row
 * of cards with holes under the short ones. Stacked vertically nobody noticed;
 * horizontally it is the first thing you see.
 *
 * So every card shows the same two lines, and the long ones open over the
 * photo: the image dims to a backdrop and the full text sits on top of it. The
 * alternative — letting the text scroll inside the card — puts a vertical
 * scroller inside a horizontal one, and on a touch screen the browser cannot
 * tell which of the two a drag meant.
 *
 * The photo and the name stay a plain link to the profile. Tapping the card to
 * expand text would have taken that over, and this section exists to be the way
 * into /partners/[slug] at all; it has already been broken once by a card that
 * only looked like a link.
 */
function PersonCard({
  person,
  t,
}: {
  person: PartnerCardData
  t: (typeof T)["en"]
}) {
  const [open, setOpen] = useState(false)
  const bioRef = useRef<HTMLParagraphElement>(null)
  const [truncated, setTruncated] = useState(false)
  const handle = instagramHandle(person.instagramUrl)

  // Whether two lines were enough is a question about rendered text, so it can
  // only be answered after layout — and again after it changes, which is what
  // the observer is for: the card is a different width on a phone, and the
  // language toggle swaps the text underneath it.
  useEffect(() => {
    const el = bioRef.current
    if (!el) return
    const measure = () => setTruncated(el.scrollHeight > el.clientHeight + 1)
    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(el)
    return () => observer.disconnect()
  }, [person.role])

  return (
    <li className="group">
      <div className="relative aspect-[4/5] overflow-hidden rounded-lg">
        <Link href={`/partners/${person.slug}`} className="block size-full">
          <Image
            src={person.image || "/placeholder.svg"}
            alt={`${person.name} — ${person.role}`}
            fill
            sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
            className="object-cover transition-transform duration-700 group-hover:scale-105"
          />
        </Link>

        {/* Mounted only while open. Kept in the DOM at opacity 0 it would be a
            second copy of the same paragraph for a screen reader to read. */}
        {open && (
          <div className="absolute inset-0 flex animate-in flex-col justify-end gap-3 bg-foreground/85 p-5 fade-in duration-300">
            <p className="max-h-full overflow-y-auto text-sm leading-relaxed text-background">
              {person.role}
            </p>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="self-start text-xs uppercase tracking-[0.2em] text-background/70 transition-colors hover:text-background"
            >
              {t.close}
            </button>
          </div>
        )}
      </div>

      <p className="mt-3 font-serif text-xl text-foreground">
        <Link
          href={`/partners/${person.slug}`}
          className="transition-colors hover:text-[var(--sage)]"
        >
          {person.name}
        </Link>
      </p>

      <p
        ref={bioRef}
        className={cn(
          "mt-0.5 line-clamp-2 text-sm text-muted-foreground text-pretty",
          // Fading the cut edge is what says "there is more" — a hard clip
          // reads as a sentence that simply ended.
          truncated &&
            "[mask-image:linear-gradient(to_bottom,black_45%,transparent)]",
        )}
      >
        {person.role}
      </p>

      {truncated && (
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          // block, or it shares a line with the Instagram handle below it —
          // both are inline by default. Kept mounted while the overlay is open
          // so the card does not change height as it opens.
          className="mt-1 block text-xs uppercase tracking-[0.2em] text-[var(--sage)] transition-colors hover:text-foreground"
        >
          {t.more}
        </button>
      )}

      {/* Instagram sits beside the profile link, not inside it. The old card
          nested them, and worked around it by making the card a div with
          role="link" — so the profile was never a real link: invisible to
          crawlers, unopenable in a new tab. */}
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
}

function PersonGrid({
  anchorId,
  title,
  people,
  t,
}: {
  anchorId: string
  title: string
  people: PartnerCardData[]
  t: (typeof T)["en"]
}) {
  return (
    <div className="mt-14">
      <span id={anchorId} className="block h-0 scroll-mt-24" aria-hidden="true" />
      <h3 className="text-sm uppercase tracking-[0.2em] text-[var(--sage)]">
        {title}
      </h3>

      <PeekRow cols="sm:grid-cols-2 lg:grid-cols-4" className="mt-6">
        {people.slice(0, MAX_PER_GROUP).map((person) => (
          <PersonCard key={person.id} person={person} t={t} />
        ))}
      </PeekRow>
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
    <Section id="people" tone="muted">
      <SectionHeader eyebrow={t.eyebrow} heading={t.heading} lead={t.lead} />

      {empty ? (
        <p className="mt-12 text-sm leading-relaxed text-muted-foreground text-pretty">
          {t.empty}
        </p>
      ) : (
        <>
          {guides.length > 0 && (
            <PersonGrid anchorId="guides" title={t.guides} people={guides} t={t} />
          )}
          {artists.length > 0 && (
            <PersonGrid anchorId="arts" title={t.artists} people={artists} t={t} />
          )}
        </>
      )}
    </Section>
  )
}
