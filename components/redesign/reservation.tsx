"use client"

import Link from "next/link"
import { ArrowRight, Calendar, MapPin } from "lucide-react"
import { useLang } from "@/components/redesign/language-provider"
import type { ReservationItem } from "@/lib/schedule/map-redesign-content"

const T = {
  en: {
    eyebrow: "Reserve",
    heading: "Reserve your quiet hour",
    intro:
      "Booking is simple. Pick an upcoming class below — you'll complete your reservation (and payment, where required) on the next page.",
    whereLabel: "Where",
    whereValue: "Brickwell, Tongui-dong, Seochon, Seoul",
    hoursLabel: "Hours",
    hoursValue: "Wed – Sun · 8:00 AM – 8:00 PM",
    contactLabel: "Contact",
    contactValue: "hello@thewellnesskorea.com",
    spotsLeft: (n: number) => `${n} spot${n === 1 ? "" : "s"} left`,
    full: "Full — join waitlist",
    reserve: "Reserve",
    empty: "No upcoming classes are open for booking right now. Please check back soon.",
  },
  ko: {
    eyebrow: "예약",
    heading: "당신의 고요한 한 시간을 예약하세요",
    intro:
      "예약은 간단합니다. 아래에서 원하는 클래스를 선택하면, 다음 페이지에서 예약(및 필요한 경우 결제)을 완료하실 수 있습니다.",
    whereLabel: "장소",
    whereValue: "브릭웰, 통의동, 서촌, 서울",
    hoursLabel: "운영 시간",
    hoursValue: "수 – 일 · 오전 8:00 – 오후 8:00",
    contactLabel: "연락처",
    contactValue: "hello@thewellnesskorea.com",
    spotsLeft: (n: number) => `${n}자리 남음`,
    full: "마감 — 대기 신청",
    reserve: "예약하기",
    empty: "현재 예약 가능한 클래스가 없습니다. 곧 새로운 일정이 열립니다.",
  },
}

export function Reservation({ items }: { items: ReservationItem[] }) {
  const { lang } = useLang()
  const t = T[lang]

  return (
    <section id="reserve" className="scroll-mt-20 bg-background py-24 sm:py-32">
      <div className="mx-auto max-w-5xl px-6">
        <div className="grid gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:gap-16">
          <div>
            <p className="text-sm uppercase tracking-[0.2em] text-[var(--sage)]">{t.eyebrow}</p>
            <h2 className="mt-4 font-serif text-4xl leading-tight text-foreground text-balance sm:text-5xl">
              {t.heading}
            </h2>
            <p className="mt-4 text-base leading-relaxed text-muted-foreground text-pretty">{t.intro}</p>
            <dl className="mt-8 space-y-4 text-sm">
              <div>
                <dt className="text-[var(--sage)]">{t.whereLabel}</dt>
                <dd className="mt-1 text-foreground">{t.whereValue}</dd>
              </div>
              <div>
                <dt className="text-[var(--sage)]">{t.hoursLabel}</dt>
                <dd className="mt-1 text-foreground">{t.hoursValue}</dd>
              </div>
              <div>
                <dt className="text-[var(--sage)]">{t.contactLabel}</dt>
                <dd className="mt-1 text-foreground">{t.contactValue}</dd>
              </div>
            </dl>
          </div>

          <div className="rounded-xl border border-border bg-card p-6 sm:p-8">
            {items.length === 0 ? (
              <p className="py-8 text-center text-sm leading-relaxed text-muted-foreground text-pretty">
                {t.empty}
              </p>
            ) : (
              <div className="divide-y divide-border">
                {items.map((item) => (
                  <article key={item.id} className="grid grid-cols-[auto_1fr] gap-4 py-6 first:pt-0 last:pb-0">
                    <div className="flex h-16 w-16 flex-none flex-col items-center justify-center rounded-lg bg-secondary text-center">
                      <span className="text-[0.65rem] uppercase tracking-widest text-[var(--sage)]">
                        {item.dateBadge[lang].month}
                      </span>
                      <span className="font-serif text-2xl text-foreground">{item.dateBadge[lang].day}</span>
                    </div>

                    <div>
                      {item.tag && (
                        <span className="inline-block rounded-full bg-accent px-2.5 py-0.5 text-xs text-accent-foreground">
                          {item.tag[lang]}
                        </span>
                      )}
                      <h3 className="mt-2 font-serif text-lg leading-tight text-foreground">{item.title[lang]}</h3>
                      {item.body[lang] && (
                        <p className="mt-1 text-sm leading-relaxed text-muted-foreground text-pretty">
                          {item.body[lang]}
                        </p>
                      )}
                      <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                        <span className="inline-flex items-center gap-1.5">
                          <Calendar className="h-3.5 w-3.5" aria-hidden="true" />
                          {item.time[lang]}
                        </span>
                        {item.place[lang] && (
                          <span className="inline-flex items-center gap-1.5">
                            <MapPin className="h-3.5 w-3.5" aria-hidden="true" />
                            {item.place[lang]}
                          </span>
                        )}
                      </div>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {item.spots > 0 ? t.spotsLeft(item.spots) : t.full}
                      </p>
                    </div>

                    <Link
                      href={`/book/${item.id}`}
                      className="col-span-2 mt-1 inline-flex w-fit items-center gap-1.5 rounded-full bg-primary px-5 py-2 text-sm text-primary-foreground transition-opacity hover:opacity-90"
                    >
                      {item.spots > 0 ? t.reserve : t.full}
                      <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                    </Link>
                  </article>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}
