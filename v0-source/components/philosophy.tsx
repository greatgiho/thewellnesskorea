"use client"

import Image from "next/image"
import { useLang } from "@/components/language-provider"

const STEPS = [
  { ko: "비움", rr: "Bium", en: "Emptying" },
  { ko: "깨움", rr: "Kkaeum", en: "Awakening" },
  { ko: "지음", rr: "Jieum", en: "Crafting" },
  { ko: "채움", rr: "Chaeum", en: "Nourishing" },
  { ko: "누림", rr: "Nurim", en: "Savoring" },
]

const T = {
  en: {
    eyebrow: "Korean Wellness",
    heading: "Wellness, the Korean way — clean, warm, and natural",
    para1:
      "Beside Gyeongbokgung Palace lies Seochon, an old neighborhood. Here we practice a wellness rooted in Korean life: not adding, but emptying; pursuing refinement without coldness. Like the plainness of baek-ui, the traditional white robe, it is a beauty free of excess — where jeong, the warmth that flows between people, is felt. That is the wellness we believe in.",
    brickHeading: "Brickwell — nature in the heart of the city",
    brickBody:
      "Built over the site of a 300-year-old pine, Brickwell holds a courtyard that opens vertically to the sky. Though it sits in the middle of Seoul, the moment you step inside the noise of the city recedes and an unfamiliar calm arrives. Within this four-story building where light and wind linger, you experience the whole of wellness — from emptying to savoring.",
    alt: "The circular courtyard of Brickwell, with trees reaching toward an oval opening in the ceiling and a natural pond below",
  },
  ko: {
    eyebrow: "한국의 웰니스",
    heading: "웰니스, 한국의 방식으로 — 정갈하고, 따뜻하고, 자연스럽게",
    para1:
      "경복궁 옆, 오래된 동네 서촌. 이곳에서 우리는 한국인의 삶에 뿌리내린 웰니스를 실천합니다. 더하지 않고 비워내는 것. 완벽을 추구하되 차갑지 않은 것. 백의(白衣)의 담백함처럼, 군더더기 없이 정갈한 아름다움 속에 사람과 사람 사이의 정(情)이 흐르는 경험 — 그것이 우리가 믿는 웰니스입니다.",
    brickHeading: "브릭웰(Brickwell), 도심 속에서 만나는 자연",
    brickBody:
      "300년 된 소나무의 자리 위에 지어진 브릭웰은 수직으로 하늘을 향해 열린 중정을 품고 있습니다. 서울 한복판이지만 이곳에 들어서는 순간, 도심의 소음이 멀어지고 낯선 평온이 찾아옵니다. 빛과 바람이 머무는 이 4층 건물 안에서 당신은 비움에서 누림까지, 웰니스의 처음과 끝을 경험하게 됩니다.",
    alt: "브릭웰의 원형 중정. 나무들이 천장의 타원형 개구부를 향해 뻗어 있고 아래에는 자연 연못이 있다",
  },
}

export function Philosophy() {
  const { lang } = useLang()
  const t = T[lang]

  return (
    <section id="philosophy" className="scroll-mt-20 bg-background py-24 sm:py-32">
      <div className="mx-auto max-w-3xl px-6 text-center">
        <h2 className="font-serif text-4xl leading-tight text-foreground text-balance sm:text-5xl">
          {t.heading}
        </h2>
        <div className="mt-8 space-y-5 text-base leading-relaxed text-muted-foreground text-pretty sm:text-lg">
          <p>
            {lang === "en" ? (
              <>
                Beside Gyeongbokgung Palace lies Seochon, an old neighborhood. Here we practice a wellness rooted in
                Korean life.
                <br />
                Not adding, but emptying — refinement without coldness.
                <br />
                Like the plainness of baek-ui, the traditional white robe.
                <br />
                It is a beauty free of excess.
                <br />
                Where jeong, the warmth between people, quietly flows.
                <br />
                That is the wellness we believe in.
              </>
            ) : (
              t.para1
            )}
          </p>
        </div>
      </div>

      {/* Brickwell — full-width atrium image with the introduction and the
          five movements of a visit overlaid together */}
      <div className="relative mt-20 w-full overflow-hidden">
        <Image src="/images/brickwell-atrium-wide.png" alt={t.alt} fill className="object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/75 to-background/25" />
        <div className="relative mx-auto flex min-h-[30rem] max-w-5xl flex-col justify-end px-6 py-16 sm:min-h-[38rem]">
          <h3 className="font-serif text-3xl leading-tight text-foreground text-balance sm:text-4xl">
            {t.brickHeading}
          </h3>
          <p className="mt-5 max-w-2xl text-base leading-relaxed text-foreground/90 text-pretty">{t.brickBody}</p>

          {/* The five movements of a visit */}
          <div className="mt-12 grid gap-x-8 gap-y-8 sm:grid-cols-3 lg:grid-cols-5">
            {STEPS.map((s, i) => (
              <div key={s.rr} className="border-t border-foreground/20 pt-4">
                <span className="text-xs uppercase tracking-widest text-[var(--sage)]">{`0${i + 1}`}</span>
                <p className="mt-2 font-serif text-2xl text-foreground">{s.ko}</p>
                <p className="mt-1 text-sm italic text-muted-foreground">
                  {s.rr} · {s.en}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
