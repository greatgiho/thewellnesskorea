"use client"

import Image from "next/image"
import { useLang } from "@/components/redesign/language-provider"

const LINKS: { href: string; label: { en: string; ko: string } }[] = [
  { href: "#philosophy", label: { en: "Philosophy", ko: "철학" } },
  { href: "#day", label: { en: "Day", ko: "낮" } },
  { href: "#night", label: { en: "Night", ko: "밤" } },
  { href: "#exhibition", label: { en: "Exhibition", ko: "전시" } },
  { href: "#reserve", label: { en: "Reserve", ko: "예약" } },
]

const T = {
  en: {
    tagline: "A calm place for Korean wellness in Seochon, Seoul. Soft, warm, and natural — come as you are.",
    explore: "Explore",
    visit: "Visit",
    address: ["Brickwell, Tongui-dong", "Seochon, Jongno-gu, Seoul", "hello@thewellnesskorea.com"],
    rights: (year: number) => `© ${year} The Wellness Korea. Made with stillness.`,
  },
  ko: {
    tagline: "서울 서촌에 자리한, 한국식 웰니스를 위한 고요한 공간. 부드럽고, 따뜻하고, 자연스럽게 — 있는 그대로 오세요.",
    explore: "둘러보기",
    visit: "찾아오기",
    address: ["브릭웰, 통의동", "서촌, 종로구, 서울", "hello@thewellnesskorea.com"],
    rights: (year: number) => `© ${year} 더 웰니스 코리아. 고요함으로 만듭니다.`,
  },
}

export function SiteFooter() {
  const { lang } = useLang()
  const t = T[lang]

  return (
    <footer className="border-t border-border bg-background py-16">
      <div className="mx-auto flex max-w-6xl flex-col gap-10 px-6 sm:flex-row sm:justify-between">
        <div className="max-w-sm">
          <Image
            src="/images/wellness-korea-logo.png"
            alt="The Wellness Korea"
            width={64}
            height={64}
            className="h-14 w-auto object-contain"
          />
          <p className="mt-4 text-sm leading-relaxed text-muted-foreground text-pretty">{t.tagline}</p>
        </div>

        <div className="flex flex-col gap-8 sm:flex-row sm:gap-16">
          <nav aria-label="Footer">
            <p className="text-sm text-[var(--sage)]">{t.explore}</p>
            <ul className="mt-3 space-y-2">
              {LINKS.map((l) => (
                <li key={l.href}>
                  <a href={l.href} className="text-sm text-muted-foreground transition-colors hover:text-foreground">
                    {l.label[lang]}
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          <div>
            <p className="text-sm text-[var(--sage)]">{t.visit}</p>
            <address className="mt-3 space-y-2 text-sm not-italic text-muted-foreground">
              {t.address.map((line) => (
                <p key={line}>{line}</p>
              ))}
            </address>
          </div>
        </div>
      </div>

      <div className="mx-auto mt-12 max-w-6xl border-t border-border px-6 pt-6">
        <p className="text-xs text-muted-foreground">{t.rights(new Date().getFullYear())}</p>
      </div>
    </footer>
  )
}
