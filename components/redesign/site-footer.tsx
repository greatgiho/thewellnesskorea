"use client"

import Image from "next/image"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useLang } from "@/components/redesign/language-provider"
import type { BankInfo, BusinessInfo, SiteInfo } from "@/lib/site/settings"
import {
  FOOTER_ONLY_LINKS,
  FOOTER_SECTION_LINKS,
  PAGE_LINKS,
  sectionHref,
} from "@/components/redesign/nav-links"

/**
 * What is still written here is what only a developer would ever change: the
 * column headings and the copyright line. The tagline and the address moved
 * into site_settings, because they are the site talking about itself and
 * operations has to be able to correct them without a deploy.
 */
const T = {
  en: {
    explore: "Explore",
    visit: "Visit",
    bank: "Bank transfer",
    rights: (year: number) => `© ${year} The Wellness Korea. Made with stillness.`,
  },
  ko: {
    explore: "둘러보기",
    visit: "찾아오기",
    bank: "무통장입금",
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

export function SiteFooter({
  site,
  business,
  bank,
}: {
  site: SiteInfo
  business: BusinessInfo | null
  /**
   * Where a transfer goes. Null when any part of it is unset — a bank with no
   * number is worse than nothing, because somebody would try to use it.
   */
  bank: BankInfo | null
}) {
  const { lang } = useLang()
  const pathname = usePathname()
  const t = T[lang]

  const tagline = lang === "ko" ? site.taglineKo : site.taglineEn
  // Stored as one field per language, a line per line, because that is how an
  // address is written and how it has to come back out.
  const addressLines = (
    lang === "ko" ? site.visitAddressKo : site.visitAddressEn
  )
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)

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
          {tagline ? (
            <p className="mt-4 text-sm leading-relaxed text-muted-foreground text-pretty">{tagline}</p>
          ) : null}
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
              {[...PAGE_LINKS, ...FOOTER_ONLY_LINKS].map((l) => (
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

          {/* Heading and all: a "Visit" column with nothing under it reads as
              a broken page, not as an address nobody has entered yet. */}
          {addressLines.length > 0 || site.contactEmail ? (
            <div>
              <p className="text-sm text-[var(--sage)]">{t.visit}</p>
              <address className="mt-3 space-y-2 text-sm not-italic text-muted-foreground">
                {addressLines.map((line) => (
                  <p key={line}>{line}</p>
                ))}
                {site.contactEmail ? (
                  <p>
                    <a
                      href={`mailto:${site.contactEmail}`}
                      className="transition-colors hover:text-foreground"
                    >
                      {site.contactEmail}
                    </a>
                  </p>
                ) : null}
              </address>
            </div>
          ) : null}
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
        {/* Beside the trader details, which is where a Korean site is looked
            at for one. The confirmation page still carries it with the amount
            and the memo — this is for somebody who closed that page, or who
            was told about us over the phone. */}
        {bank ? (
          <p className="mb-3 text-xs leading-relaxed text-muted-foreground">
            <span className="text-muted-foreground/60">{t.bank}</span>{" "}
            {bank.bankName} {bank.accountNumber} ({bank.accountHolder})
          </p>
        ) : null}
        <p className="text-xs text-muted-foreground">{t.rights(new Date().getFullYear())}</p>
      </div>
    </footer>
  )
}
