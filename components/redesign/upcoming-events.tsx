"use client"

import Link from "next/link"
import { Calendar, MapPin, Users } from "lucide-react"
import { useLang } from "@/components/redesign/language-provider"
import {
  DateBadge,
  MetaItem,
  MetaList,
  Section,
  SectionHeader,
  Tag,
} from "@/components/redesign/primitives"
import Image from "next/image"
import type { ReservationItem } from "@/lib/schedule/map-redesign-content"

/**
 * The upcoming classes, as the design original lays them out: a divided list of
 * dated rows, each a date badge beside its text and a reserve control on the
 * far edge. No photography — the section reads as a timetable, which is what
 * the sections around it are not.
 *
 * The rows are real bookable sessions and each control links into the existing
 * /book/[sessionId] flow, so this is also the page's booking entry point. That
 * is why it carries id="upcoming" and why the nav's "Reserve" points here: the
 * original's separate Reservation form panel is not rendered, because booking
 * already has a real flow behind it.
 *
 * The original's header also carried a "Reserve a seat" button. It is dropped
 * rather than ported — in the original it jumped to that separate panel, and
 * here it would only scroll to the section the reader is already in.
 *
 * Capped at MAX_ITEMS. The cap used to be 6, which was inherited from the
 * accordion this replaced — a strip of many thin panels stops looking good. A
 * divided list does not have that problem, and the cap is doing real damage
 * here: the pre-redesign homepage listed every bookable class, and this is now
 * the only place on the site where a class can be booked, so anything past the
 * cap cannot be reached at all.
 */
const MAX_ITEMS = 12

const T = {
  en: {
    eyebrow: "다가오는 · Upcoming",
    heading: "What's coming to Brickwell",
    lead: "Pick an upcoming class below — you'll complete your reservation (and payment, where required) on the next page.",
    seats: (left: number, total: number) => `${left} / ${total} seats left`,
    reserve: "Reserve",
    full: "Full — join waitlist",
    started: "Booking closed",
    empty: "No upcoming classes are open for booking right now. Please check back soon.",
  },
  ko: {
    eyebrow: "다가오는 · Upcoming",
    heading: "브릭웰에서 열리는 다음 클래스",
    lead: "아래에서 원하는 클래스를 선택하면, 다음 페이지에서 예약(및 필요한 경우 결제)을 완료하실 수 있습니다.",
    seats: (left: number, total: number) => `잔여 ${left} / 정원 ${total}`,
    reserve: "예약하기",
    full: "마감 — 대기 신청",
    started: "예약 마감",
    empty: "현재 예약 가능한 클래스가 없습니다. 곧 새로운 일정이 열립니다.",
  },
}

export function UpcomingEvents({ items }: { items: ReservationItem[] }) {
  const { lang } = useLang()
  const t = T[lang]
  const shown = items.slice(0, MAX_ITEMS)

  return (
    <Section id="upcoming" tone="muted">
      <SectionHeader eyebrow={t.eyebrow} heading={t.heading} lead={t.lead} />

      {shown.length === 0 ? (
        <p className="mt-12 text-sm leading-relaxed text-muted-foreground text-pretty">
          {t.empty}
        </p>
      ) : (
        <div className="mt-12 divide-y divide-border border-y border-border">
          {shown.map((item) => {
            const badge = item.dateBadge[lang]
            return (
              <article
                key={item.id}
                className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-4 py-8 sm:grid-cols-[auto_auto_1fr_auto] sm:items-center"
              >
                <DateBadge month={badge.month} day={badge.day} />

                {/* The photo the design original always had on this row. It
                    was dropped when the list became text-only; the row is a
                    grid now, so it has a column of its own rather than
                    competing with the copy for width. */}
                <div className="relative hidden size-24 shrink-0 overflow-hidden rounded-xl sm:block">
                  <Image
                    src={item.image}
                    alt=""
                    fill
                    sizes="6rem"
                    className="object-cover"
                  />
                </div>

                <div className="col-span-1">
                  {item.tag && <Tag>{item.tag[lang]}</Tag>}
                  <h3
                    className={`font-serif text-2xl text-foreground ${item.tag ? "mt-2" : ""}`}
                  >
                    {item.title[lang]}
                  </h3>
                  {/* Directly under the title, above the summary. These are
                      what someone scanning a list is deciding on — when, where,
                      and whether there is room — and underneath a paragraph
                      they were being read last or not at all. */}
                  <MetaList className="mt-2">
                    <MetaItem icon={Calendar}>{item.time[lang]}</MetaItem>
                    {item.place[lang] && (
                      <MetaItem icon={MapPin}>{item.place[lang]}</MetaItem>
                    )}
                    {!item.hasStarted && (
                      <MetaItem icon={Users}>
                        {t.seats(item.spots, item.capacity)}
                      </MetaItem>
                    )}
                  </MetaList>
                  {item.body[lang] && (
                    <p className="mt-3 text-sm leading-relaxed text-muted-foreground text-pretty">
                      {item.body[lang]}
                    </p>
                  )}
                </div>

                {/* A class that already started is past what /book accepts, so
                    it gets a label rather than a link — see ReservationItem's
                    hasStarted. A full one still links: the booking page is
                    where the waitlist lives. */}
                {item.hasStarted ? (
                  <span className="col-span-2 justify-self-start rounded-full border border-border px-5 py-2.5 text-center text-sm text-muted-foreground sm:col-span-1 sm:justify-self-end">
                    {t.started}
                  </span>
                ) : (
                  <Link
                    href={`/book/${item.id}`}
                    className="col-span-2 justify-self-start rounded-full bg-primary px-5 py-2.5 text-center text-sm text-primary-foreground transition-opacity hover:opacity-90 sm:col-span-1 sm:justify-self-end"
                  >
                    {item.spots > 0 ? t.reserve : t.full}
                  </Link>
                )}
              </article>
            )
          })}
        </div>
      )}
    </Section>
  )
}
