"use client"

import Image from "next/image"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useLang } from "@/components/redesign/language-provider"
import type { BusinessInfo } from "@/lib/site/business-info"
import {
  FOOTER_SECTION_LINKS,
  PAGE_LINKS,
  sectionHref,
} from "@/components/redesign/nav-links"

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

/**
 * The legally required trader details, in the order they are conventionally
 * printed. The values are one set — a registration number and a registered
 * address have one official form — so only the labels follow the toggle.
 */
const BUSINESS_FIELDS: {
  key: keyof BusinessInfo
  en: string
  ko: string
}[] = [
  { key: "businessName", en: "Business name", ko: "상호" },
  { key: "representativeName", en: "Representative", ko: "대표자" },
  { key: "businessNumber", en: "Business reg. no.", ko: "사업자등록번호" },
  { key: "mailOrderNumber", en: "Mail-order reg. no.", ko: "통신판매업신고번호" },
  { key: "address", en: "Address", ko: "주소" },
  { key: "phone", en: "Tel", ko: "전화" },
  { key: "email", en: "Email", ko: "이메일" },
  { key: "privacyOfficer", en: "Privacy officer", ko: "개인정보관리책임자" },
]

export function SiteFooter({ business }: { business: BusinessInfo | null }) {
  const { lang } = useLang()
  const pathname = usePathname()
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
              {FOOTER_SECTION_LINKS.map((l) => (
                <li key={l.id}>
                  <a
                    href={sectionHref(pathname, l.id)}
                    className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                  >
                    {l.label[lang]}
                  </a>
                </li>
              ))}
              {/* The old footer carried these. Dropping them would take
                  Journal, Privacy, and Terms off every page that only ever
                  reached them from here. */}
              {PAGE_LINKS.map((l) => (
                <li key={l.href}>
                  <Link
                    href={l.href}
                    className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                  >
                    {l.label[lang]}
                  </Link>
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
        {/* Entered in the admin, one field at a time, so a half-filled record
            is normal — each line appears only once it has something to say. */}
        {business ? (
          <ul className="mb-3 flex flex-wrap gap-x-4 gap-y-1 text-xs leading-relaxed text-muted-foreground">
            {BUSINESS_FIELDS.filter((f) => business[f.key]).map((f) => (
              <li key={f.key}>
                <span className="text-muted-foreground/60">{f[lang]}</span>{" "}
                {business[f.key]}
              </li>
            ))}
          </ul>
        ) : null}
        <p className="text-xs text-muted-foreground">{t.rights(new Date().getFullYear())}</p>
      </div>
    </footer>
  )
}
