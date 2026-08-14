import { cache } from "react"
import { createClient } from "@/lib/supabase/server"

/**
 * Everything the site says about itself that operations can edit: the footer's
 * own copy, and the trader details the law requires under it.
 *
 * All of it lives in one row (see 056_site_settings.sql and 057_site_info.sql)
 * rather than in the components, for two reasons that turn out to be the same
 * reason. dev and production are separate Supabase projects, so a value in the
 * database differs between them with no branching anywhere in the code. And a
 * value in the database changes without a deploy, which a NEXT_PUBLIC_* env
 * var — baked into the bundle at build time, and bound to a deployment by
 * Vercel — cannot.
 *
 * `cache()` because the footer is on every page and more than one thing on a
 * page may want this — one query per request, not per caller.
 *
 * Read through the request's own (cookie-bound) client, which opts the route
 * out of static generation. That is the point rather than a cost: a value
 * baked in at build time would need a redeploy to change, and not needing one
 * is the reason any of this is in a table. It costs the couple of pages that
 * had nothing else to query — /privacy and /terms — their prerender, and
 * nothing else; every other public page already reads the database per
 * request.
 */

/** The footer's own voice: what the site says, in the reader's language. */
export type SiteInfo = {
  taglineEn: string
  taglineKo: string
  visitAddressEn: string
  visitAddressKo: string
  contactEmail: string
}

/** The trader details the e-commerce act requires on every page. */
export type BusinessInfo = {
  businessName: string
  representativeName: string
  businessNumber: string
  mailOrderNumber: string
  address: string
  phone: string
  email: string
  privacyOfficer: string
}

export type SiteSettings = {
  site: SiteInfo
  business: BusinessInfo
}

/**
 * Only for the legal pages, which name the contact address mid-sentence.
 *
 * The footer can simply drop a line it has nothing for; "contact us at ." is
 * not a sentence, so those two pages need something to print when the field
 * has been cleared. Safe to hard-code, unlike the trader details: this is a
 * published address, not a claim about a company.
 */
export const DEFAULT_CONTACT_EMAIL = "hello@thewellnesskorea.com"

export const EMPTY_SITE_INFO: SiteInfo = {
  taglineEn: "",
  taglineKo: "",
  visitAddressEn: "",
  visitAddressKo: "",
  contactEmail: "",
}

export const EMPTY_BUSINESS_INFO: BusinessInfo = {
  businessName: "",
  representativeName: "",
  businessNumber: "",
  mailOrderNumber: "",
  address: "",
  phone: "",
  email: "",
  privacyOfficer: "",
}

export const EMPTY_SITE_SETTINGS: SiteSettings = {
  site: EMPTY_SITE_INFO,
  business: EMPTY_BUSINESS_INFO,
}

/**
 * Column ⇄ field, in one place.
 *
 * The admin form names its inputs after the columns and the save action writes
 * whichever of these it is given, so a new field is added here and nowhere
 * else. Keeping the mapping next to the types is what stops a rename from
 * type-checking cleanly while quietly saving into nothing.
 */
export const SITE_INFO_COLUMNS: Record<keyof SiteInfo, string> = {
  taglineEn: "tagline_en",
  taglineKo: "tagline_ko",
  visitAddressEn: "visit_address_en",
  visitAddressKo: "visit_address_ko",
  contactEmail: "contact_email",
}

export const BUSINESS_INFO_COLUMNS: Record<keyof BusinessInfo, string> = {
  businessName: "business_name",
  representativeName: "representative_name",
  businessNumber: "business_number",
  mailOrderNumber: "mail_order_number",
  address: "address",
  phone: "phone",
  email: "email",
  privacyOfficer: "privacy_officer",
}

/** Every column this table exposes to the admin form. */
export const EDITABLE_COLUMNS: string[] = [
  ...Object.values(SITE_INFO_COLUMNS),
  ...Object.values(BUSINESS_INFO_COLUMNS),
]

/**
 * Flatten back to column ⇄ value, for the admin form, whose inputs are named
 * after the columns so the save action can allowlist them directly.
 */
export function toColumnValues(settings: SiteSettings): Record<string, string> {
  const out: Record<string, string> = {}
  for (const [field, column] of Object.entries(SITE_INFO_COLUMNS)) {
    out[column] = settings.site[field as keyof SiteInfo]
  }
  for (const [field, column] of Object.entries(BUSINESS_INFO_COLUMNS)) {
    out[column] = settings.business[field as keyof BusinessInfo]
  }
  return out
}

/**
 * The columns a submitted form actually carried, trimmed.
 *
 * Only what was submitted, because the settings page shows more than one form
 * against the same row: writing every known column would let saving the footer
 * copy blank the trader details the other form happened to be showing.
 *
 * Filtered against EDITABLE_COLUMNS rather than taken as it arrives — the
 * field names are column names, and a form post is client input.
 */
export function pickEditableColumns(
  formData: FormData,
): Record<string, string> {
  const patch: Record<string, string> = {}
  for (const column of EDITABLE_COLUMNS) {
    if (!formData.has(column)) continue
    patch[column] = String(formData.get(column) ?? "").trim()
  }
  return patch
}

type Row = Record<string, string | null>

function group<T extends Record<string, string>>(
  row: Row,
  columns: Record<keyof T, string>,
): T {
  const out = {} as T
  for (const [field, column] of Object.entries(columns) as [
    keyof T,
    string,
  ][]) {
    out[field] = (row[column]?.trim() ?? "") as T[keyof T]
  }
  return out
}

/** True when there is nothing worth rendering — no partly-empty legal block. */
export function isBusinessInfoEmpty(info: BusinessInfo): boolean {
  return Object.values(info).every((v) => v === "")
}

export const getSiteSettings = cache(async (): Promise<SiteSettings> => {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("site_settings")
    .select(EDITABLE_COLUMNS.join(", "))
    .maybeSingle()

  // Empty rather than a hard-coded copy of the real values. A constant
  // fallback would have to hold production's registration number, which is the
  // one thing this table exists to keep out of the code — and if this query is
  // failing, every other query on the page is failing too, so the footer is not
  // what the visitor is missing.
  if (error) {
    console.error("[site-settings] read failed:", error.message)
    return EMPTY_SITE_SETTINGS
  }
  if (!data) return EMPTY_SITE_SETTINGS

  // The select list is built from the column map rather than written out, so
  // supabase-js cannot infer a shape from it and falls back to its error type.
  const row = data as unknown as Row
  return {
    site: group<SiteInfo>(row, SITE_INFO_COLUMNS),
    business: group<BusinessInfo>(row, BUSINESS_INFO_COLUMNS),
  }
})
