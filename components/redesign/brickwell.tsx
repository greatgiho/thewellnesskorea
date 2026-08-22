"use client"

import { useEffect, useState, useCallback } from "react"
import Image from "next/image"
import { Sun, Moon, Frame, Clock, MapPin, X, ArrowRight } from "lucide-react"
import { useLang } from "@/components/redesign/language-provider"
import {
  MetaItem,
  MetaList,
  Section,
  SectionHeader,
} from "@/components/redesign/primitives"
import type { BilingualText, BrickwellItem } from "@/lib/schedule/map-redesign-content"

type Bi = BilingualText
type Item = BrickwellItem
type CategoryId = "day" | "night" | "exhibition"

type Category = {
  id: CategoryId
  label: Bi
  tagline: Bi
  Icon: typeof Sun
  cover: string
  items: Item[]
}

// Label/tagline/icon/cover are fixed UI chrome for these three fixed slots —
// only `items` (real upcoming sessions tagged with this content_category,
// see lib/schedule/redesign-content.ts) comes from the DB.
const CATEGORY_META: Omit<Category, "items">[] = [
  {
    id: "day",
    label: { en: "Day", ko: "낮" },
    tagline: {
      en: "Classes, grounding walks, and daytime retreats held in natural light.",
      ko: "자연광 아래 열리는 클래스와 걷기 명상, 그리고 낮의 리트릿.",
    },
    Icon: Sun,
    cover: "/images/courtyard-tree.jpeg",
  },
  {
    id: "night",
    label: { en: "Night", ko: "밤" },
    tagline: {
      en: "Evening gatherings and sound under the open, darkening sky.",
      ko: "어둑해지는 열린 하늘 아래, 저녁의 모임과 사운드.",
    },
    Icon: Moon,
    cover: "/images/brickwell-atrium.jpeg",
  },
  {
    id: "exhibition",
    label: { en: "Exhibition", ko: "전시" },
    tagline: {
      en: "Quiet works held in the space — ceramics, ink, and light.",
      ko: "공간이 품은 조용한 작품들 — 도자, 먹, 그리고 빛.",
    },
    Icon: Frame,
    cover: "/images/reflecting-pool.jpeg",
  },
]

const T = {
  en: {
    heading: "One space, three rhythms",
    intro:
      "Brickwell changes through the day. Explore what unfolds in daylight, after dark, and on the gallery walls — tap a panel, then open any moment to see more.",
    readMore: "Read more",
    reserveSeat: "Reserve a seat",
    planVisit: "Plan a visit",
    close: "Close",
    open: (label: string) => `Open ${label}`,
    whereLabel: "Where",
    whereValue: "18-8, Jahamun-ro 6-gil, Jongno-gu, Seoul, Korea",
    hoursLabel: "Hours",
    hoursValue: "Mon – Sun · 10:00 AM – 10:00 PM",
    contactLabel: "Contact",
    contactValue: "Giho.watt.lee@thewellnesskorea.com",
  },
  ko: {
    heading: "하나의 공간, 세 개의 리듬",
    intro:
      "브릭웰은 하루 동안 변합니다. 낮에, 어둠이 내린 뒤에, 그리고 갤러리 벽에서 펼쳐지는 것들을 살펴보세요. 패널을 누르고, 원하는 순간을 열어 더 깊이 들여다보세요.",
    readMore: "자세히 보기",
    reserveSeat: "자리 예약하기",
    planVisit: "방문 계획하기",
    close: "닫기",
    open: (label: string) => `${label} 열기`,
    whereLabel: "장소",
    whereValue: "서울특별시 종로구 자하문로6길 18-8",
    hoursLabel: "운영 시간",
    hoursValue: "월 – 일 · 오전 10:00 – 오후 10:00",
    contactLabel: "연락처",
    contactValue: "Giho.watt.lee@thewellnesskorea.com",
  },
}

const OVERLAY: Record<CategoryId, string> = {
  day: "from-[oklch(0.35_0.03_75)]/85 via-[oklch(0.4_0.03_80)]/40",
  night: "from-[oklch(0.18_0.02_260)]/90 via-[oklch(0.22_0.02_250)]/55",
  exhibition: "from-[oklch(0.24_0.012_60)]/85 via-[oklch(0.3_0.012_60)]/45",
}

export function Brickwell({
  itemsByCategory,
}: {
  itemsByCategory: Record<CategoryId, Item[]>
}) {
  const { lang } = useLang()
  const t = T[lang]
  const CATEGORIES: Category[] = CATEGORY_META.map((meta) => ({
    ...meta,
    items: itemsByCategory[meta.id] ?? [],
  }))
  const [active, setActive] = useState<CategoryId | null>("day")
  const [selected, setSelected] = useState<{ cat: Category; item: Item } | null>(null)

  // Let the menu buttons (#day / #night / #exhibition) open the right panel.
  useEffect(() => {
    const applyHash = () => {
      const h = window.location.hash.replace("#", "")
      if (h === "day" || h === "night" || h === "exhibition") setActive(h)
    }
    applyHash()
    window.addEventListener("hashchange", applyHash)
    return () => window.removeEventListener("hashchange", applyHash)
  }, [])

  const close = useCallback(() => setSelected(null), [])

  useEffect(() => {
    if (!selected) return
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && close()
    window.addEventListener("keydown", onKey)
    document.body.style.overflow = "hidden"
    return () => {
      window.removeEventListener("keydown", onKey)
      document.body.style.overflow = ""
    }
  }, [selected, close])

  return (
    <>
      <Section id="brickwell" tone="muted">
        {/* Anchor targets so nav buttons can scroll here and open a panel */}
        <span id="day" className="block h-0 scroll-mt-24" aria-hidden="true" />
        <span id="night" className="block h-0 scroll-mt-24" aria-hidden="true" />
        <span id="exhibition" className="block h-0 scroll-mt-24" aria-hidden="true" />

        <SectionHeader heading={t.heading} lead={t.intro} />

        {/* Where/Hours/Contact. In the original these sat in the Reservation
            panel, which this page does not render — without them the address
            and opening hours appear nowhere on the homepage. */}
        <dl className="mt-8 flex flex-wrap gap-x-8 gap-y-2 text-sm">
          <div>
            <dt className="inline text-[var(--sage)]">{t.whereLabel}: </dt>
            <dd className="inline text-foreground">{t.whereValue}</dd>
          </div>
          <div>
            <dt className="inline text-[var(--sage)]">{t.hoursLabel}: </dt>
            <dd className="inline text-foreground">{t.hoursValue}</dd>
          </div>
          <div>
            <dt className="inline text-[var(--sage)]">{t.contactLabel}: </dt>
            <dd className="inline text-foreground">{t.contactValue}</dd>
          </div>
        </dl>

        {/* Mobile tabs */}
        <div className="mt-10 flex gap-2 md:hidden">
          {CATEGORIES.map((c) => {
            const isActive = c.id === active
            return (
              <button
                key={c.id}
                onClick={() => setActive(c.id)}
                className={`flex flex-1 items-center justify-center gap-1.5 rounded-full px-3 py-2.5 text-sm transition-colors ${
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "border border-border bg-background text-foreground"
                }`}
                aria-pressed={isActive}
              >
                <c.Icon className="h-4 w-4" aria-hidden="true" />
                {c.label[lang]}
              </button>
            )
          })}
        </div>

        {/* Desktop: one framed strip of expanding panels divided by hairlines */}
        <div className="mt-6 hidden h-[560px] gap-px overflow-hidden rounded-2xl bg-border shadow-sm md:flex">
          {CATEGORIES.map((c) => {
            const isActive = c.id === active
            const toggle = () => setActive((prev) => (prev === c.id ? null : c.id))
            return (
              <div
                key={c.id}
                role="button"
                tabIndex={0}
                aria-pressed={isActive}
                aria-label={t.open(c.label[lang])}
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
                  src={c.cover || "/placeholder.svg"}
                  alt=""
                  fill
                  className={`object-cover transition-transform duration-700 ${
                    isActive ? "scale-100" : "scale-110 group-hover:scale-105"
                  }`}
                />
                <div className={`absolute inset-0 bg-gradient-to-t to-transparent ${OVERLAY[c.id]}`} />

                {isActive ? (
                  <div className="relative flex h-full flex-col justify-between p-7">
                    <div>
                      <div className="flex items-center gap-2 text-background/90">
                        <c.Icon className="h-5 w-5" aria-hidden="true" />
                        <span className="text-sm uppercase tracking-[0.2em]">{c.label[lang]}</span>
                      </div>
                      <p className="mt-3 max-w-md font-serif text-2xl leading-snug text-background text-pretty">
                        {c.tagline[lang]}
                      </p>
                    </div>

                    {/* Item strip */}
                    <div className="flex gap-4 overflow-x-auto pb-1">
                      {c.items.map((item) => (
                        <button
                          key={item.id}
                          onClick={() => setSelected({ cat: c, item })}
                          className="group w-52 flex-none overflow-hidden rounded-lg bg-background/95 text-left shadow-lg backdrop-blur transition-transform hover:-translate-y-1"
                        >
                          <div className="relative aspect-[4/3] overflow-hidden">
                            <Image
                              src={item.image || "/placeholder.svg"}
                              alt={item.title[lang]}
                              fill
                              className="object-cover transition-transform duration-500 group-hover:scale-105"
                            />
                          </div>
                          <div className="p-3.5">
                            <p className="font-serif text-base leading-tight text-foreground">{item.title[lang]}</p>
                            <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground text-pretty">
                              {item.blurb[lang]}
                            </p>
                            <span className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-foreground">
                              {t.readMore} <ArrowRight className="h-3 w-3" aria-hidden="true" />
                            </span>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="relative flex h-full items-end justify-center p-5">
                    <div className="flex flex-col items-center gap-3">
                      <c.Icon className="h-6 w-6 text-background" aria-hidden="true" />
                      <span
                        className="font-serif text-2xl tracking-wide text-background"
                        style={{ writingMode: "vertical-rl" }}
                      >
                        {c.label[lang]}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {/* Mobile: active category list */}
        <div className="mt-6 space-y-4 md:hidden">
          {CATEGORIES.filter((c) => c.id === active).map((c) => (
            <div key={c.id}>
              <p className="mb-4 text-sm leading-relaxed text-muted-foreground text-pretty">{c.tagline[lang]}</p>
              <div className="space-y-4">
                {c.items.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setSelected({ cat: c, item })}
                    className="flex w-full gap-4 overflow-hidden rounded-lg border border-border bg-card text-left"
                  >
                    <div className="relative aspect-square w-28 flex-none overflow-hidden">
                      <Image src={item.image || "/placeholder.svg"} alt={item.title[lang]} fill className="object-cover" />
                    </div>
                    <div className="flex flex-col justify-center py-3 pr-3">
                      <p className="font-serif text-lg leading-tight text-foreground">{item.title[lang]}</p>
                      <p className="mt-1 text-xs leading-relaxed text-muted-foreground text-pretty">{item.blurb[lang]}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </Section>

      {/* Detail modal */}
      {selected && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center p-4 sm:p-6"
          role="dialog"
          aria-modal="true"
          aria-label={selected.item.title[lang]}
        >
          <button
            className="absolute inset-0 bg-foreground/50 backdrop-blur-sm"
            onClick={close}
            aria-label={t.close}
          />
          <div className="relative z-10 flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl bg-card shadow-2xl sm:flex-row">
            <div className="relative aspect-[4/3] w-full flex-none sm:aspect-auto sm:w-1/2">
              <Image
                src={selected.item.image || "/placeholder.svg"}
                alt={selected.item.title[lang]}
                fill
                className="object-cover"
              />
            </div>
            <div className="flex flex-1 flex-col overflow-y-auto p-7 sm:p-8">
              <div className="flex items-center gap-2 text-[var(--sage)]">
                <selected.cat.Icon className="h-4 w-4" aria-hidden="true" />
                <span className="text-xs uppercase tracking-[0.2em]">{selected.cat.label[lang]}</span>
              </div>
              <h3 className="mt-3 font-serif text-3xl leading-tight text-foreground text-balance">
                {selected.item.title[lang]}
              </h3>
              <MetaList className="mt-4">
                <MetaItem icon={Clock}>{selected.item.meta[lang]}</MetaItem>
                {selected.item.place[lang] && (
                  <MetaItem icon={MapPin}>{selected.item.place[lang]}</MetaItem>
                )}
              </MetaList>
              <p className="mt-5 flex-1 text-sm leading-relaxed text-muted-foreground text-pretty">
                {selected.item.body[lang]}
              </p>
              {/* Sends the reader to the list of bookable classes rather than
                  straight to /book/[id] for this item: a Brickwell panel also
                  carries exhibitions, which are not booked, and sessions that
                  have already started, which /book refuses. */}
              <a
                href="#upcoming"
                onClick={close}
                className="mt-7 inline-flex items-center justify-center gap-2 rounded-full bg-primary px-6 py-3 text-sm text-primary-foreground transition-opacity hover:opacity-90"
              >
                {selected.cat.id === "exhibition" ? t.planVisit : t.reserveSeat}
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </a>
            </div>
            <button
              onClick={close}
              className="absolute right-3 top-3 inline-flex h-9 w-9 items-center justify-center rounded-full bg-background/80 text-foreground transition-colors hover:bg-background"
              aria-label={t.close}
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
        </div>
      )}
    </>
  )
}
