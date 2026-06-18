import type { JournalPostRow } from "./types"

/** Static posts until `journal_posts` table exists (Phase J2). */
export const FALLBACK_JOURNAL_POSTS: JournalPostRow[] = [
  {
    id: "fallback-live-the-time",
    slug: "live-the-time-more-fully",
    title_en: "Live the time given to you, more fully.",
    title_ko: "주어진 시간을, 더 온전히 살아가다.",
    excerpt_en:
      "The Wellness Korea is not a cure or a single moment of healing. It is a way of restoring calm, rhythm, and clarity to the way you live each day.",
    body_en: `The Wellness Korea is not a cure or a single moment of healing. It is a way of restoring calm, rhythm, and clarity to the way you live each day.

Brickwell in Seochon is our first Space—a courtyard where movement, stillness, and sound meet without hurry. We built it for people who want their week to feel intentional again, not optimized.

> We do not promise transformation in an hour. We offer a place where time can feel wider.

## A Space, not a spectacle

A Space in our language is a long-term venue: somewhere you return to, not a one-off event. Brickwell holds daily classes, quiet hours, and gatherings shaped by the five paths—Bium, Kkaeum, Jieum, Chaeum, and Nurim.

Journeys will come later—retreats, festivals, seasonal programs. The Journal is where we share how those ideas take shape in real rooms and real schedules.

## What you will find here

In this journal we write about philosophy, the life of a Space, the people who guide and create with us, and news as we grow. If you are new, start with our homepage schedule or meet a Wellness Guide—then come back here for the longer view.`,
    hero_image_path: "/kw-hero.png",
    category: "philosophy",
    published_at: "2026-06-02T00:00:00.000Z",
    read_minutes: 6,
    is_published: true,
    experience_id: null,
    seo_title: null,
    seo_description: null,
    created_at: "2026-06-02T00:00:00.000Z",
    updated_at: "2026-06-02T00:00:00.000Z",
  },
  {
    id: "fallback-brickwell-seochon",
    slug: "brickwell-seochon-space",
    title_en: "Brickwell: a calm courtyard in Seochon",
    title_ko: "Brickwell: 서촌의 고요한 마당",
    excerpt_en:
      "Our first Space sits near Gyeongbokgung and Seochon—four floors of classes, stillness, and sound held in an unhurried rhythm.",
    body_en: `Seochon keeps an older pace. Alleys narrow, light falls differently, and the city feels farther away than maps suggest. Brickwell was named for the well at the center of the courtyard—a place to draw water, pause, and continue.

## Four floors, one rhythm

From the ground floor upward, each level holds a different tone: movement, meditation, sound, and smaller gatherings. The schedule is not packed for its own sake; sessions leave room before and after so arrival and departure stay gentle.

## Coming soon at The Wellness Korea

Our next Space is already in planning. The homepage hero shows a coming-soon slide because we believe in naming what is not open yet—rather than filling silence with placeholder promises.

When it opens, this journal will carry its story the same way: plainly, with images and time to read.`,
    hero_image_path: "/kw-hero.png",
    category: "space",
    published_at: "2026-05-27T00:00:00.000Z",
    read_minutes: 5,
    is_published: true,
    experience_id: null,
    seo_title: null,
    seo_description: null,
    created_at: "2026-05-27T00:00:00.000Z",
    updated_at: "2026-05-27T00:00:00.000Z",
  },
]
