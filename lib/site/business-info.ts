import { cache } from "react"
import { createClient } from "@/lib/supabase/server"

/**
 * The business/representative details the footer prints.
 *
 * Read from the database (see 056_site_settings.sql), which is also what makes
 * dev and production differ: they are separate Supabase projects, so each
 * carries its own values with no environment branching anywhere in the code.
 *
 * `cache()` because the footer is on every page and a page may compose more
 * than one thing that wants it — one query per request, not per caller.
 *
 * Read through the request's own (cookie-bound) client, which opts the route
 * out of static generation. That is the point rather than a cost: a value
 * baked in at build time would need a redeploy to change, and not needing one
 * is the reason these details live in a table at all. It costs the couple of
 * pages that had nothing else to query — /privacy and /terms — their
 * prerender, and nothing else; every other public page already reads the
 * database per request.
 */

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

const SELECT =
  "business_name, representative_name, business_number, mail_order_number, address, phone, email, privacy_officer"

type Row = {
  business_name: string | null
  representative_name: string | null
  business_number: string | null
  mail_order_number: string | null
  address: string | null
  phone: string | null
  email: string | null
  privacy_officer: string | null
}

function fromRow(row: Row): BusinessInfo {
  return {
    businessName: row.business_name?.trim() ?? "",
    representativeName: row.representative_name?.trim() ?? "",
    businessNumber: row.business_number?.trim() ?? "",
    mailOrderNumber: row.mail_order_number?.trim() ?? "",
    address: row.address?.trim() ?? "",
    phone: row.phone?.trim() ?? "",
    email: row.email?.trim() ?? "",
    privacyOfficer: row.privacy_officer?.trim() ?? "",
  }
}

/** True when there is nothing worth rendering — no partly-empty legal block. */
export function isBusinessInfoEmpty(info: BusinessInfo): boolean {
  return Object.values(info).every((v) => v === "")
}

export const getBusinessInfo = cache(async (): Promise<BusinessInfo> => {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("site_settings")
    .select(SELECT)
    .maybeSingle()

  // Empty rather than a hard-coded copy of the real details. A constant
  // fallback would have to hold production's registration number, which is the
  // one thing this table exists to keep out of the code — and if this query is
  // failing, every other query on the page is failing too, so the footer is not
  // what the visitor is missing.
  if (error) {
    console.error("[site-settings] read failed:", error.message)
    return EMPTY_BUSINESS_INFO
  }
  return data ? fromRow(data as Row) : EMPTY_BUSINESS_INFO
})
