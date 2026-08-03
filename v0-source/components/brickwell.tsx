"use client"

import { useEffect, useState, useCallback } from "react"
import Image from "next/image"
import { Sun, Moon, Frame, Clock, MapPin, X, ArrowRight } from "lucide-react"
import { useLang } from "@/components/language-provider"

type Bi = { en: string; ko: string }

type Item = {
  title: Bi
  meta: Bi
  place: Bi
  blurb: Bi
  body: Bi
  // Swap these with your own event photos later.
  image: string
}

type Category = {
  id: "day" | "night" | "exhibition"
  label: Bi
  tagline: Bi
  Icon: typeof Sun
  cover: string
  items: Item[]
}

const CATEGORIES: Category[] = [
  {
    id: "day",
    label: { en: "Day", ko: "낮" },
    tagline: {
      en: "Classes, grounding walks, and daytime retreats held in natural light.",
      ko: "자연광 아래 열리는 클래스와 걷기 명상, 그리고 낮의 리트릿.",
    },
    Icon: Sun,
    cover: "/images/courtyard-tree.jpeg",
    items: [
      {
        title: { en: "Morning Grounding Walk", ko: "아침 걷기 명상" },
        meta: { en: "Sun · 8:30 AM · 60 min", ko: "일요일 · 오전 8:30 · 60분" },
        place: { en: "Seochon & Brickwell", ko: "서촌 & 브릭웰" },
        blurb: {
          en: "A slow walk through Seochon's old alleys into the courtyard.",
          ko: "서촌의 오래된 골목을 지나 중정으로 향하는 느린 걷기.",
        },
        body: {
          en: "Begin the day with a quiet walk through Seochon's old alleys, arriving at the Brickwell courtyard for breathing practice by the reflecting pool. A gentle way to arrive in your body before the city wakes.",
          ko: "서촌의 오래된 골목을 조용히 걸으며 하루를 시작하고, 브릭웰 중정에 도착해 반영 연못 곁에서 호흡을 수련합니다. 도시가 깨어나기 전, 몸으로 돌아오는 부드러운 방법입니다.",
        },
        image: "/images/courtyard-tree.jpeg",
      },
      {
        title: { en: "Daytime Meditation Journey", ko: "낮 명상 여정" },
        meta: { en: "Wed–Fri · 11:00 AM · 90 min", ko: "수–금 · 오전 11:00 · 90분" },
        place: { en: "Garden → Glass House", ko: "정원 → 글라스하우스" },
        blurb: {
          en: "Singing-bowl breathing, a mindful walk, and warm tea.",
          ko: "싱잉볼 호흡, 알아차림의 걷기, 그리고 따뜻한 차.",
        },
        body: {
          en: "A guided arc through the space — singing-bowl breathing in the garden, a mindful walk to the glass house, and a warm tea meditation. Moving with the light as it shifts through the vertical courtyard.",
          ko: "공간을 관통하는 하나의 여정입니다. 정원에서의 싱잉볼 호흡, 글라스하우스로 향하는 알아차림의 걷기, 그리고 따뜻한 차명상. 수직의 중정을 지나 변해가는 빛과 함께 움직입니다.",
        },
        image: "/images/meditation-program.jpeg",
      },
      {
        title: { en: "Weekend Wellness Retreat", ko: "주말 웰니스 리트릿" },
        meta: { en: "Sat · 10:00 AM · Half day", ko: "토요일 · 오전 10:00 · 반나절" },
        place: { en: "Brickwell, full space", ko: "브릭웰 전 공간" },
        blurb: {
          en: "A half-day of grounding, walking, holding, and emptying.",
          ko: "머무르기, 이어지기, 머금기, 비워내기로 이어지는 반나절.",
        },
        body: {
          en: "A half-day retreat that moves through all four rhythms of Brickwell — grounding, walking, holding, and emptying — with seasonal tea and rest between practices. For those who want to stay a little longer.",
          ko: "브릭웰의 네 가지 리듬 — 머무르기, 이어지기, 머금기, 비워내기 — 를 모두 지나는 반나절 리트릿입니다. 수련 사이사이 계절의 차와 쉼이 함께합니다. 조금 더 머물고 싶은 분들을 위해.",
        },
        image: "/images/reflecting-pool.jpeg",
      },
    ],
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
    items: [
      {
        title: { en: "Evening Sound Bath", ko: "저녁 사운드 배스" },
        meta: { en: "Fri · 7:00 PM · 75 min", ko: "금요일 · 오후 7:00 · 75분" },
        place: { en: "Vertical Courtyard", ko: "수직의 중정" },
        blurb: {
          en: "Lie back as sound rises through the open atrium.",
          ko: "열린 아트리움을 타고 오르는 소리에 몸을 맡기세요.",
        },
        body: {
          en: "Lie beneath the open sky as sound rises through the vertical space and the courtyard darkens. An evening of emptying out, closing with a quiet seasonal tea ceremony.",
          ko: "열린 하늘 아래 누워, 소리가 수직의 공간을 타고 오르고 중정이 어둑해지는 시간. 비워내는 저녁이며, 조용한 계절의 차 의식으로 마무리됩니다.",
        },
        image: "/images/brickwell-atrium.jpeg",
      },
      {
        title: { en: "Candlelit Tea Meditation", ko: "촛불 차명상" },
        meta: { en: "Fri · 7:30 PM · 60 min", ko: "금요일 · 오후 7:30 · 60분" },
        place: { en: "Glass House", ko: "글라스하우스" },
        blurb: {
          en: "A tea meditation as dusk settles over the city.",
          ko: "도시에 어스름이 내려앉는 시간의 차명상.",
        },
        body: {
          en: "An evening tea meditation with artist Shin Kyung-hee, holding space as dusk settles over the city. Warm light, slow pours, and the stillness of being contained.",
          ko: "신경희 작가와 함께하는 저녁 차명상. 도시에 어스름이 내려앉는 동안 자리를 지킵니다. 따뜻한 빛, 느린 차 따르기, 그리고 머금어지는 고요함.",
        },
        image: "/images/reflecting-pool.jpeg",
      },
      {
        title: { en: "Full Moon Sound Ceremony", ko: "보름달 사운드 세리머니" },
        meta: { en: "Monthly · 8:00 PM · 90 min", ko: "매월 · 오후 8:00 · 90분" },
        place: { en: "Courtyard, open sky", ko: "열린 하늘의 중정" },
        blurb: {
          en: "A monthly ceremony held under the full moon.",
          ko: "보름달 아래 매월 열리는 의식.",
        },
        body: {
          en: "Once a month, as the moon rises over the open courtyard, we gather for a longer sound ceremony. Deep resonance, warm blankets, and a shared silence beneath the sky.",
          ko: "한 달에 한 번, 달이 열린 중정 위로 떠오를 때 우리는 조금 더 긴 사운드 의식을 위해 모입니다. 깊은 울림, 따뜻한 담요, 그리고 하늘 아래 함께 나누는 침묵.",
        },
        image: "/images/courtyard-tree.jpeg",
      },
    ],
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
    items: [
      {
        title: { en: "Shin Kyung-hee — Holding", ko: "신경희 — 보듬이" },
        meta: { en: "Now – Jun 2026", ko: "현재 – 2026년 6월" },
        place: { en: "Glass House Gallery", ko: "글라스하우스 갤러리" },
        blurb: {
          en: "Ceramic vessels made to be held during tea meditation.",
          ko: "차명상 중에 손에 쥐도록 만들어진 도자 기물.",
        },
        body: {
          en: "A collection of ceramic vessels by artist Shin Kyung-hee, made to be held — warm in the palm during our tea meditations. The exhibition moves through the glass house, each piece resting where the light finds it.",
          ko: "신경희 작가의 도자 기물 모음으로, 차명상 중 손바닥 안에서 따뜻하게 쥐도록 만들어졌습니다. 전시는 글라스하우스를 따라 이어지며, 각 작품은 빛이 닿는 자리에 놓여 있습니다.",
        },
        image: "/images/meditation-program.jpeg",
      },
      {
        title: { en: "Ink & Emptiness", ko: "먹과 비움" },
        meta: { en: "Now – May 2026", ko: "현재 – 2026년 5월" },
        place: { en: "Courtyard Corridor", ko: "중정 회랑" },
        blurb: {
          en: "Ink brushwork exploring the space between strokes.",
          ko: "획과 획 사이의 공간을 탐구하는 먹 작업.",
        },
        body: {
          en: "An ink brushwork exhibition exploring the space between strokes — the emptiness that gives a line its meaning. Hung along the courtyard corridor, the works shift with the daylight passing through the rods.",
          ko: "획과 획 사이의 공간 — 선에 의미를 부여하는 비움 — 을 탐구하는 먹 작업 전시입니다. 중정 회랑을 따라 걸린 작품들은 봉 사이로 스미는 햇빛과 함께 변합니다.",
        },
        image: "/images/reflecting-pool.jpeg",
      },
      {
        title: { en: "Light Through Rods", ko: "봉을 통과하는 빛" },
        meta: { en: "Ongoing", ko: "상시" },
        place: { en: "The Building Itself", ko: "건축물 그 자체" },
        blurb: {
          en: "The architecture as a living, changing artwork.",
          ko: "살아 움직이며 변화하는 작품으로서의 건축.",
        },
        body: {
          en: "Brickwell's own architecture as a living work — thousands of thin vertical rods that catch and release the light through the day. A standing invitation to look up and watch the space breathe.",
          ko: "브릭웰의 건축 그 자체가 살아 있는 작품입니다. 수천 개의 가느다란 수직 봉이 하�� 동안 빛을 붙잡았다 놓아줍니다. 고개를 들어 공간이 숨 쉬는 모습을 바라보라는, 늘 열려 있는 초대.",
        },
        image: "/images/brickwell-atrium.jpeg",
      },
    ],
  },
]

const T = {
  en: {
    eyebrow: "Brickwell",
    heading: "One space, three rhythms",
    intro:
      "Brickwell changes through the day. Explore what unfolds in daylight, after dark, and on the gallery walls — tap a panel, then open any moment to see more.",
    readMore: "Read more",
    reserveSeat: "Reserve a seat",
    planVisit: "Plan a visit",
    close: "Close",
    open: (label: string) => `Open ${label}`,
  },
  ko: {
    eyebrow: "브릭웰",
    heading: "하나의 공간, 세 개의 리듬",
    intro:
      "브릭웰은 하루 동안 변합니다. 낮에, 어둠이 내린 뒤에, 그리고 갤러리 벽에서 펼쳐지는 것들을 살펴보세요. 패널을 누르고, 원하는 순간을 열어 더 깊이 들여다보세요.",
    readMore: "자세히 보기",
    reserveSeat: "자리 예약하기",
    planVisit: "방문 계획하기",
    close: "닫기",
    open: (label: string) => `${label} 열기`,
  },
}

const OVERLAY: Record<Category["id"], string> = {
  day: "from-[oklch(0.35_0.03_75)]/85 via-[oklch(0.4_0.03_80)]/40",
  night: "from-[oklch(0.18_0.02_260)]/90 via-[oklch(0.22_0.02_250)]/55",
  exhibition: "from-[oklch(0.24_0.012_60)]/85 via-[oklch(0.3_0.012_60)]/45",
}

export function Brickwell() {
  const { lang } = useLang()
  const t = T[lang]
  const [active, setActive] = useState<Category["id"] | null>("day")
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
    <section id="brickwell" className="scroll-mt-20 bg-secondary/40 py-24 sm:py-32">
      {/* Anchor targets so nav buttons can scroll here and open a panel */}
      <span id="day" className="block h-0 scroll-mt-24" aria-hidden="true" />
      <span id="night" className="block h-0 scroll-mt-24" aria-hidden="true" />
      <span id="exhibition" className="block h-0 scroll-mt-24" aria-hidden="true" />

      <div className="mx-auto max-w-6xl px-6">
        <div className="max-w-2xl">
          <h2 className="font-serif text-4xl leading-tight text-foreground text-balance sm:text-5xl">
            {t.heading}
          </h2>
          <p className="mt-4 text-base leading-relaxed text-muted-foreground text-pretty">{t.intro}</p>
        </div>

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
                          key={item.title.en}
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
                    key={item.title.en}
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
      </div>

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
              <div className="mt-4 flex flex-wrap gap-x-5 gap-y-1.5 text-xs text-muted-foreground">
                <span className="inline-flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5" aria-hidden="true" />
                  {selected.item.meta[lang]}
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <MapPin className="h-3.5 w-3.5" aria-hidden="true" />
                  {selected.item.place[lang]}
                </span>
              </div>
              <p className="mt-5 flex-1 text-sm leading-relaxed text-muted-foreground text-pretty">
                {selected.item.body[lang]}
              </p>
              <a
                href="#reserve"
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
    </section>
  )
}
