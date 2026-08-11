import type { Metadata } from "next"
import { deploymentOrigin } from "@/lib/site-origin"

/**
 * Link previews.
 *
 * Nothing on the site declared Open Graph tags, so pasting any URL anywhere —
 * KakaoTalk, Slack, iMessage — got whatever the scraper could scavenge, which
 * was the app icon. Every page has a picture of its own; a partner profile
 * showing the site's front door instead of that person's face is the whole
 * complaint.
 *
 * One builder rather than tags per page, because the pieces that go wrong are
 * the ones nobody remembers: the absolute URL, the twitter card type that
 * decides between a thumbnail and a banner, and the fallback when the page has
 * no picture. Getting those right once is the point of this file.
 */

export const SITE_NAME = "The Wellness Korea"

/** 1200×630, the size every scraper is happy with. */
export const DEFAULT_OG_IMAGE = "/og-default.jpg"

/**
 * The origin previews should point at.
 *
 * deploymentOrigin() rather than the configured site URL: a link shared from a
 * preview has to preview *that* deployment, not production. Same reasoning as
 * the ticket links, and the same reason it is not used for auth.
 */
export function metadataBase(): URL {
  return new URL(deploymentOrigin())
}

type SocialMetadataInput = {
  title: string
  description?: string | null
  /**
   * The page's own picture. Absolute (Supabase storage) or root-relative;
   * metadataBase resolves the latter. Anything falsy — including the
   * "/placeholder.svg" the image helpers return for a missing upload — falls
   * back to the site image.
   */
  image?: string | null
  /** Root-relative path of the page itself, for og:url. */
  path: string
  type?: "website" | "article" | "profile"
  /** Overrides the browser tab title when it should differ from the card. */
  pageTitle?: string
}

function resolveImage(image: string | null | undefined): string {
  if (!image) return DEFAULT_OG_IMAGE
  // The image helpers hand back a placeholder rather than null when a row has
  // no upload. A grey placeholder in a shared link is worse than the building.
  if (image.endsWith("/placeholder.svg")) return DEFAULT_OG_IMAGE
  return image
}

export function socialMetadata({
  title,
  description,
  image,
  path,
  type = "website",
  pageTitle,
}: SocialMetadataInput): Metadata {
  const resolved = resolveImage(image)
  const desc = description?.trim() || undefined

  return {
    title: pageTitle ?? title,
    description: desc,
    openGraph: {
      title,
      description: desc,
      siteName: SITE_NAME,
      type,
      url: path,
      locale: "ko_KR",
      images: [{ url: resolved, alt: title }],
    },
    twitter: {
      // summary_large_image, not summary: the small card crops a portrait to a
      // stamp beside the text, which for a person's photo is a thumbnail of an
      // ear.
      card: "summary_large_image",
      title,
      description: desc,
      images: [resolved],
    },
  }
}
