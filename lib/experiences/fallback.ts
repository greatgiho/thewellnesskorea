import type { ExperienceRow } from "./types"

/** Used when Supabase is unavailable or returns no rows (local dev). */
export const FALLBACK_EXPERIENCES: ExperienceRow[] = [
  {
    id: "fallback-brickwell",
    slug: "brickwell",
    kind: "space",
    name_en: "Brickwell",
    name_ko: "브릭웰",
    hero_image_path: "/kw-hero.png",
    headline_en: "Live the time given to you, more fully.",
    description_en:
      "The Wellness Korea is not a cure or a single moment of healing. It is a way of restoring calm, rhythm, and clarity to the way you live each day.",
    secondary_link_label_en: "Visit our Space in Seochon, Brickwell",
    secondary_link_href: "#footer",
    sort_order: 0,
    is_published: true,
    schedule_enabled: true,
    created_at: "",
    updated_at: "",
  },
  {
    id: "fallback-next-space",
    slug: "next-space",
    kind: "space",
    name_en: "Next Space",
    name_ko: null,
    hero_image_path: null,
    headline_en: "A new chapter is taking shape.",
    description_en:
      "The Wellness Korea continues to grow across spaces and journeys. Our next Space will be announced soon.",
    secondary_link_label_en: null,
    secondary_link_href: null,
    sort_order: 1,
    is_published: true,
    schedule_enabled: false,
    created_at: "",
    updated_at: "",
  },
]
