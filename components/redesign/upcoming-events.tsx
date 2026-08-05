"use client"

import { useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { useLang } from "@/components/redesign/language-provider"
import type { ReservationItem } from "@/lib/schedule/map-redesign-content"

// Merges what used to be two near-duplicate "list of upcoming classes"
// sections (Programs, Reservation) into one. Reuses the same real
// bookable-sessions data Reservation was already wired to (individual
// occurrences, not deduped by title).
//
// Desktop panel is a 1:1 copy of Brickwell's day/night/exhibition
// interaction: one panel "active" by default (wide, full content), the
// rest collapsed to a vertical label; click toggles which is active,
// hover on an inactive panel only bumps it slightly. That means the
// reserve button / spots-left text are only visible on the active panel,
// same as Brickwell hides everything but icon+label when collapsed — this
// was a deliberate choice (see conversation) over keeping them always
// visible, to match Brickwell exactly.
//
// Capped at MAX_ITEMS: a strip with many thin slivers stops looking good,
// and there's no real-world data yet to know how many upcoming sessions is
// typical. Add pagination/"see more" once that's a real problem. Mobile
// falls back to a plain card grid — a strip of many equally-thin slivers
// doesn't work at phone width.
//
// Images are a temporary /placeholder.svg (see
// lib/schedule/map-redesign-content.ts's TEMP_PLACEHOLDER_IMAGE) until
// real poster images are set per session.
const MAX_ITEMS = 6

const T = {
  en: {
    eyebrow: "Upcoming",
    heading: "What's coming to Brickwell",
    introLine1: "Pick an upcoming class below — you'll complete your reservation",
    introLine2: "(and payment, where required) on the next page.",
    spotsLeft: (n: number) => `${n} spot${n === 1 ? "" : "s"} left`,
    full: "Full — join waitlist",
    started: "Booking closed",
    reserve: "Reserve",
    empty: "No upcoming classes are open for booking right now. Please check back soon.",
    open: (label: string) => `Open ${label}`,
    close: "Close",
  },
  ko: {
    eyebrow: "다가오는",
    heading: "브릭웰에서 열리는 다음 클래스",
    intro: "아래에서 원하는 클래스를 선택하면, 다음 페이지에서 예약(및 필요한 경우 결제)을 완료하실 수 있습니다.",
    spotsLeft: (n: number) => `${n}자리 남음`,
    full: "마감 — 대기 신청",
    started: "예약 마감",
    reserve: "예약하기",
    empty: "현재 예약 가능한 클래스가 없습니다. 곧 새로운 일정이 열립니다.",
    open: (label: string) => `${label} 열기`,
    close: "닫기",
  },
}

export function UpcomingEvents({ items }: { items: ReservationItem[] }) {
  const { lang } = useLang()
  const t = T[lang]
  const shown = items.slice(0, MAX_ITEMS)
  const [active, setActive] = useState<string | null>(shown[0]?.id ?? null)

  return (
    <section id="upcoming" className="scroll-mt-20 bg-background py-24 sm:py-32">
      <div className="mx-auto max-w-6xl px-6">
        <div className="max-w-2xl">
          <p className="text-sm uppercase tracking-[0.2em] text-[var(--sage)]">{t.eyebrow}</p>
          <h2 className="mt-4 font-serif text-4xl leading-tight text-foreground text-balance sm:text-5xl">
            {t.heading}
          </h2>
          <p className="mt-4 text-base leading-relaxed text-muted-foreground text-pretty">
            {lang === "en" ? (
              <>
                {T.en.introLine1}
                <br />
                {T.en.introLine2}
              </>
            ) : (
              T.ko.intro
            )}
          </p>
        </div>

        {shown.length === 0 ? (
          <p className="mt-14 text-sm leading-relaxed text-muted-foreground text-pretty">{t.empty}</p>
        ) : (
          <>
            {/* Desktop: same active/hover accordion strip as Brickwell's panels */}
            <div className="mt-14 hidden h-[560px] gap-px overflow-hidden rounded-2xl bg-border shadow-sm md:flex">
              {shown.map((item) => {
                const isActive = item.id === active
                const label = `${item.dateBadge[lang].month} ${item.dateBadge[lang].day}`
                const toggle = () => setActive((prev) => (prev === item.id ? null : item.id))
                return (
                  <div
                    key={item.id}
                    role="button"
                    tabIndex={0}
                    aria-pressed={isActive}
                    aria-label={t.open(label)}
                    onClick={toggle}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault()
                        toggle()
                      }
                    }}
                    className={`group relative cursor-pointer overflow-hidden transition-[flex-grow] duration-500 ease-out ${
                      isActive ? "flex-[3.4]" : "flex-[1] hover:flex-[1.7]"
                    }`}
                  >
                    <Image
                      src={item.image || "/placeholder.svg"}
                      alt={item.title[lang]}
                      fill
                      className={`object-cover transition-transform duration-700 ${
                        isActive ? "scale-100" : "scale-110 group-hover:scale-105"
                      }`}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-foreground/85 via-foreground/30 to-transparent" />

                    {isActive ? (
                      <div className="relative flex h-full flex-col justify-between p-7">
                        <div className="flex h-14 w-14 flex-col items-center justify-center rounded-lg bg-background/90 text-center backdrop-blur-sm">
                          <span className="text-[0.65rem] uppercase tracking-widest text-[var(--sage)]">
                            {item.dateBadge[lang].month}
                          </span>
                          <span className="font-serif text-xl text-foreground">{item.dateBadge[lang].day}</span>
                        </div>

                        <div>
                          <p className="max-w-md font-serif text-2xl leading-snug text-background text-pretty">
                            {item.title[lang]}
                          </p>
                          <p className="mt-2 text-sm text-background/80">
                            {item.hasStarted
                              ? t.started
                              : item.spots > 0
                                ? t.spotsLeft(item.spots)
                                : t.full}
                          </p>
                          {item.hasStarted ? (
                            <span className="mt-4 inline-flex w-fit items-center rounded-full border border-background/40 px-5 py-2.5 text-sm text-background/70">
                              {t.started}
                            </span>
                          ) : (
                            <Link
                              href={`/book/${item.id}`}
                              onClick={(e) => e.stopPropagation()}
                              className="mt-4 inline-flex w-fit items-center gap-1.5 rounded-full bg-primary px-5 py-2.5 text-sm text-primary-foreground transition-opacity hover:opacity-90"
                            >
                              {item.spots > 0 ? t.reserve : t.full}
                              <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                            </Link>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="relative flex h-full items-end justify-center p-5">
                        <span
                          className="font-serif text-xl tracking-wide text-background"
                          style={{ writingMode: "vertical-rl" }}
                        >
                          {label}
                        </span>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>

            {/* Mobile: plain card grid — a strip of thin slivers doesn't work at phone width */}
            <div className="mt-14 grid gap-8 md:hidden">
              {shown.map((item) => (
                <article
                  key={item.id}
                  className="flex flex-col overflow-hidden rounded-lg border border-border bg-card"
                >
                  <div className="relative aspect-[4/3] overflow-hidden">
                    <Image
                      src={item.image || "/placeholder.svg"}
                      alt={item.title[lang]}
                      fill
                      className="object-cover"
                    />
                    <div className="absolute left-3 top-3 flex h-14 w-14 flex-col items-center justify-center rounded-lg bg-background/90 text-center backdrop-blur-sm">
                      <span className="text-[0.65rem] uppercase tracking-widest text-[var(--sage)]">
                        {item.dateBadge[lang].month}
                      </span>
                      <span className="font-serif text-xl text-foreground">{item.dateBadge[lang].day}</span>
                    </div>
                  </div>
                  <div className="flex flex-1 flex-col p-6">
                    <h3 className="font-serif text-xl text-foreground">{item.title[lang]}</h3>
                    <p className="mt-2 text-xs text-muted-foreground">
                      {item.hasStarted
                        ? t.started
                        : item.spots > 0
                          ? t.spotsLeft(item.spots)
                          : t.full}
                    </p>
                    {item.hasStarted ? (
                      <span className="mt-4 inline-flex w-fit items-center rounded-full border border-border px-5 py-2.5 text-sm text-muted-foreground">
                        {t.started}
                      </span>
                    ) : (
                      <Link
                        href={`/book/${item.id}`}
                        className="mt-4 inline-flex w-fit items-center gap-1.5 rounded-full bg-primary px-5 py-2.5 text-sm text-primary-foreground transition-opacity hover:opacity-90"
                      >
                        {item.spots > 0 ? t.reserve : t.full}
                        <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                      </Link>
                    )}
                  </div>
                </article>
              ))}
            </div>
          </>
        )}
      </div>
    </section>
  )
}
