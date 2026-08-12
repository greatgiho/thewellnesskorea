"use client"

import Image from "next/image"
import { useLang } from "@/components/redesign/language-provider"
import { PeekRow } from "@/components/redesign/peek-row"
import { Section, SectionHeader } from "@/components/redesign/primitives"
import { PATHS } from "@/lib/paths/paths-data"

/**
 * The five paths — 비움 · 깨움 · 지음 · 채움 · 누림.
 *
 * Carried over from the pre-redesign homepage, which the redesign dropped. They
 * are the brand's own vocabulary, and every session on the site is tagged with
 * one (see PathKey), so losing the section leaves the tags on class cards
 * referring to something the site never explains.
 *
 * The headwords stay in Korean in both languages. They are names, not labels to
 * be translated; the English gloss sits under them rather than replacing them.
 */
const T = {
  en: {
    eyebrow: "다섯 갈래 · Five Paths",
    heading: "Five ways through a day here",
    lead: "Every class belongs to one of five paths. Together they move from emptying the mind to savoring what is around you.",
  },
  ko: {
    eyebrow: "다섯 갈래 · Five Paths",
    heading: "이곳에서의 하루를 지나는 다섯 갈래",
    lead: "모든 클래스는 다섯 갈래 중 하나에 속합니다. 생각을 비우는 데서 시작해, 곁에 있는 것을 누리는 데까지 이어집니다.",
  },
}

export function Paths() {
  const { lang } = useLang()
  const t = T[lang]

  return (
    <Section id="paths" tone="muted">
      <SectionHeader eyebrow={t.eyebrow} heading={t.heading} lead={t.lead} />

      <PeekRow cols="sm:grid-cols-2 lg:grid-cols-5" className="mt-14">
        {PATHS.map((path) => (
          <li key={path.key}>
            <figure className="group">
              <div className="relative aspect-[3/4] overflow-hidden rounded-lg">
                <Image
                  src={path.image}
                  alt=""
                  fill
                  sizes="(min-width: 1024px) 20vw, (min-width: 640px) 50vw, 100vw"
                  className="object-cover transition-transform duration-700 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-foreground/70 to-transparent" />
                <figcaption className="absolute inset-x-0 bottom-0 p-4">
                  <p className="font-serif text-2xl text-background">{path.ko}</p>
                  <p className="text-xs uppercase tracking-widest text-background/80">
                    {path.en.replace(/\s*\(.*\)/, "").trim()}
                  </p>
                </figcaption>
              </div>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground text-pretty">
                {lang === "ko" ? path.sloganKo : path.enDesc}
              </p>
            </figure>
          </li>
        ))}
      </PeekRow>
    </Section>
  )
}
