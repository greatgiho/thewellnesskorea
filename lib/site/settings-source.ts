import { cache } from "react"
import {
  BUSINESS_INFO_COLUMNS,
  EMPTY_BANK_INFO,
  EMPTY_BUSINESS_INFO,
  SITE_INFO_COLUMNS,
  getSiteSettings,
  type BankInfo,
  type BusinessInfo,
  type SiteInfo,
} from "@/lib/site/settings"

/**
 * Where the footer's contents come from, in order, and when production refuses
 * to serve without them.
 *
 *   1. the database — edited in the admin, no deploy, different per environment
 *   2. SITE_SETTINGS_FALLBACK — a backstop so a database blip cannot take the
 *      site down; set on production only, since nowhere else hard-fails
 *   3. the placeholders below — obviously unset, for development
 *
 * Production never reaches 3. If neither the database nor the environment has
 * the trader details the e-commerce act requires, the public site shows a
 * configuration screen instead of pages that would be unlawful to serve.
 *
 * That is why 2 matters: with the fallback set, a transient database failure
 * lands on 2 and the site stays up. Without it, one bad query is an outage.
 *
 * The two blocks resolve independently. A cleared tagline should not push the
 * trader details onto the fallback, and an unset registration number should not
 * replace copy someone deliberately wrote.
 */

export type SettingsSource = "database" | "env" | "placeholder"

/**
 * 전자상거래법 제10조: the fields a cyber-mall must show. Deliberately not all
 * eight — 통신판매업 신고번호 cannot be filled before the registration exists,
 * and 개인정보관리책임자 is a different statute. Blocking the site over a field
 * nobody can supply yet would be a worse failure than the one being prevented.
 */
export const REQUIRED_BUSINESS_FIELDS: (keyof BusinessInfo)[] = [
  "businessName",
  "representativeName",
  "businessNumber",
  "address",
  "phone",
  "email",
]

/**
 * What a developer sees when nothing is configured. Written to look unset on
 * sight: these must never read as a real company's details, which is the whole
 * reason production refuses them rather than printing them.
 */
export const PLACEHOLDER_BUSINESS_INFO: BusinessInfo = {
  businessName: "(미설정) 상호",
  representativeName: "(미설정) 대표자",
  businessNumber: "000-00-00000",
  mailOrderNumber: "제0000-0000호",
  address: "(미설정) 사업자 주소",
  phone: "00-0000-0000",
  email: "example@example.com",
  privacyOfficer: "(미설정) 개인정보관리책임자",
}

/**
 * The copy the component carried before 057 moved it into the table. Real text
 * rather than a placeholder, because it is already published — the point of
 * moving it was where it is edited, not what it says.
 */
export const PLACEHOLDER_SITE_INFO: SiteInfo = {
  taglineEn:
    "A calm place for Korean wellness in Seochon, Seoul. Soft, warm, and natural — come as you are.",
  taglineKo:
    "서울 서촌에 자리한, 한국식 웰니스를 위한 고요한 공간. 부드럽고, 따뜻하고, 자연스럽게 — 있는 그대로 오세요.",
  visitAddressEn: "Brickwell, Tongui-dong\nSeochon, Jongno-gu, Seoul",
  visitAddressKo: "브릭웰, 통의동\n서촌, 종로구, 서울",
  contactEmail: "hello@thewellnesskorea.com",
}

export type ResolvedSettings = {
  site: SiteInfo
  business: BusinessInfo
  /**
   * Straight from the database, with no fallback behind it.
   *
   * The other two blocks fall back to an env copy and then to placeholders, so
   * a database blip cannot take the site down. An account number has no such
   * chain: a stale or invented one sends money to a stranger, so the only safe
   * answer when it cannot be read is none.
   */
  bank: BankInfo
  siteSource: SettingsSource
  businessSource: SettingsSource
  /** Required fields the database is still missing — what the admin must fill. */
  missingInDatabase: (keyof BusinessInfo)[]
  /** Set when SITE_SETTINGS_FALLBACK exists but could not be used. */
  envError: string | null
}

export function missingRequired(info: BusinessInfo): (keyof BusinessInfo)[] {
  return REQUIRED_BUSINESS_FIELDS.filter((field) => !info[field])
}

function hasRequired(info: BusinessInfo): boolean {
  return missingRequired(info).length === 0
}

function isEmpty(info: SiteInfo): boolean {
  return Object.values(info).every((v) => !v)
}

/** True only on the production deployment; previews and local are never blocked. */
export function isProductionDeployment(): boolean {
  return process.env.VERCEL_ENV === "production"
}

type EnvSettings = { site: SiteInfo; business: BusinessInfo } | null

/**
 * SITE_SETTINGS_FALLBACK, a JSON object keyed by column name — the same names
 * the admin form uses, so a value can be copied between the two without
 * translating anything.
 *
 * Never throws. A malformed fallback must not take down the site it exists to
 * keep up; it is reported instead, and shown in the admin so nobody discovers
 * a typo here on the day the database is down.
 */
function parseEnvSettings(raw: string): {
  settings: EnvSettings
  error: string | null
} {
  let parsed: unknown
  try {
    parsed = JSON.parse(raw)
  } catch {
    return { settings: null, error: "JSON 형식이 아닙니다." }
  }
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    return { settings: null, error: "JSON 객체가 아닙니다." }
  }

  const row = parsed as Record<string, unknown>
  const read = <T extends Record<string, string>>(
    columns: Record<keyof T, string>,
  ): T => {
    const out = {} as T
    for (const [field, column] of Object.entries(columns) as [
      keyof T,
      string,
    ][]) {
      const value = row[column]
      out[field] = (typeof value === "string" ? value.trim() : "") as T[keyof T]
    }
    return out
  }

  return {
    settings: {
      site: read<SiteInfo>(SITE_INFO_COLUMNS),
      business: read<BusinessInfo>(BUSINESS_INFO_COLUMNS),
    },
    error: null,
  }
}

export const resolveSiteSettings = cache(
  async (): Promise<ResolvedSettings> => {
    const db = await getSiteSettings()

    const raw = process.env.SITE_SETTINGS_FALLBACK?.trim()
    const { settings: env, error: parseError } = raw
      ? parseEnvSettings(raw)
      : { settings: null, error: null }

    if (parseError) {
      console.error("[site-settings] SITE_SETTINGS_FALLBACK:", parseError)
    }

    // Partly-filled counts as unset. Six of the required fields showing and one
    // missing is not a smaller version of compliance — it is a page that looks
    // right and is not, which is exactly what nobody would notice.
    let business = PLACEHOLDER_BUSINESS_INFO
    let businessSource: SettingsSource = "placeholder"
    if (hasRequired(db.business)) {
      business = db.business
      businessSource = "database"
    } else if (env && hasRequired(env.business)) {
      business = env.business
      businessSource = "env"
    }

    // Prose, so any of it is better than none — an emptied tagline is a choice,
    // an entirely empty block is an unconfigured environment.
    let site = PLACEHOLDER_SITE_INFO
    let siteSource: SettingsSource = "placeholder"
    if (!isEmpty(db.site)) {
      site = db.site
      siteSource = "database"
    } else if (env && !isEmpty(env.site)) {
      site = env.site
      siteSource = "env"
    }

    return {
      site,
      business,
      bank: db.bank ?? EMPTY_BANK_INFO,
      siteSource,
      businessSource,
      // Against the database specifically: the admin fills the database, so
      // this is the list of fields someone has to go and type.
      missingInDatabase: missingRequired(db.business ?? EMPTY_BUSINESS_INFO),
      envError: parseError,
    }
  },
)

/**
 * Whether the public site must refuse to render.
 *
 * Only on production, and only when both real sources came up short. Checked in
 * PublicShell rather than the proxy on purpose: the admin area does not use
 * that shell, so it stays reachable — the screen tells you to go and fill the
 * fields in, and you can.
 */
export function mustBlockPublicSite(resolved: ResolvedSettings): boolean {
  return isProductionDeployment() && resolved.businessSource === "placeholder"
}
