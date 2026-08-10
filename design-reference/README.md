# design-reference

Design originals kept verbatim, for reading — never built, never routed, never
deployed.

Nothing in this directory is part of the application. It exists so that when we
change the homepage we can diff our components against the design they came
from, instead of guessing what the original looked like from memory or from a
screenshot.

## What is here

| Directory     | What it is                                                         |
| ------------- | ------------------------------------------------------------------ |
| `v0-original` | The v0.app export of the homepage redesign, exactly as it arrived. |

`v0-original` is a complete, standalone Next.js project — its own `app/`,
`package.json`, `pnpm-lock.yaml`, and `public/`. It is kept whole rather than
trimmed to the interesting files so that `pnpm install && pnpm dev` inside it
still renders the untouched original when you need to see it moving rather than
read it. Its own README from v0 is preserved as `README.v0.md`.

Provenance: greatgiho/thewellnesskorea PR #27, merged into
`feat/redesign-homepage` as commit 16afff6.

## Why it cannot reach production

Four separate things keep it out, because any one of them alone is easy to undo
by accident:

1. **Not routed.** Next only routes the repository-root `app/`. This tree's
   `app/page.tsx` is an ordinary file to the build.
2. **Not served.** Next only serves the repository-root `public/`. Nothing under
   `v0-original/public/` is reachable by URL.
3. **Not uploaded.** `.vercelignore` at the repository root excludes
   `design-reference`, so the deployment source never contains it.
4. **Not compiled or scanned.** `tsconfig.json` excludes it from type checking,
   and `app/globals.css` has `@source not "../design-reference"` so Tailwind's
   automatic content detection does not harvest class names from it. Without
   that last one the original's classes leak into the shipped stylesheet.

If you move or rename this directory, all four references have to move with it.

## The originals, and what we did with them

Our versions live in `components/redesign/`, under the same filenames. Every
section keeps the original's layout; what differs is that the data is real and
the links go somewhere.

| Original                | Ours                                                            |
| ----------------------- | --------------------------------------------------------------- |
| `language-provider.tsx` | Identical apart from the import path.                            |
| `hero-canvas.tsx`       | Identical apart from the import path.                            |
| `philosophy.tsx`        | Copy edit only.                                                  |
| `site-nav.tsx`          | Anchor corrected; sign-in and my-bookings links added.           |
| `site-footer.tsx`       | Anchor corrected; journal/privacy/terms links restored.          |
| `brickwell.tsx`         | Hardcoded items → props; Where/Hours/Contact absorbed from below. |
| `upcoming-events.tsx`   | Hardcoded events → real bookable sessions; each row links to `/book/[id]`. |
| `past-events.tsx`       | Hardcoded archive → real past sessions and their photos.         |
| `programs.tsx`          | Not carried over. Its content is the Upcoming list.              |
| `reservation.tsx`       | Not carried over. Booking is a real flow at `/book/[sessionId]`. |

The original composes six sections and defines two more it never renders
(`UpcomingEvents`, `PastEvents`). We render those two and drop `Reservation`.

We also render two sections the original has no counterpart for, carried over
from the pre-redesign homepage because dropping them lost real content:

| Ours          | Why it exists                                                     |
| ------------- | ----------------------------------------------------------------- |
| `paths.tsx`   | 비움 · 깨움 · 지음 · 채움 · 누림. Every session is tagged with one of these, so without the section the tags on class cards name something the site never explains. Headwords stay Korean in both languages — they are names. |
| `people.tsx`  | Guides and artists. These were the only route into `/partners/[slug]` from anywhere public; without them every partner profile is an orphan page. |

So the running page is: nav, hero, Philosophy, Paths, People, Brickwell,
Upcoming, Past, footer. Sections alternate plain and muted backgrounds — that
banding is the only thing separating them, so reordering or removing one means
re-checking the tones of its neighbours.

Two sections of the old homepage were *not* carried over: `WhyKorea`, whose
argument Philosophy already makes, and `ClosingCta`, whose primary button was
already a dead `href="#"` and whose job the nav's Book CTA now does. Both are
still in `components/` and still composed by `app/page.pre-redesign-backup.tsx`.

Two consequences of dropping `Reservation` are worth knowing, because both are
invisible until you look for them:

- Every `#reserve` anchor in the original — in the nav, the footer, the
  Brickwell detail modal, and the Upcoming header — pointed at that panel. They
  now point at `#upcoming`, except the header button, which is dropped because
  it would only scroll to the section it sits in. An anchor naming a section
  that no longer exists still type-checks and still builds; it just silently
  does nothing.
- Its info panel held the address, opening hours, and contact address. Those
  moved into Brickwell rather than being dropped with it.

Beyond the sections, `components/redesign/primitives.tsx` holds the shapes the
original restated inline in every file — the band, the section header, the date
badge, the tag, the meta row. Match those rather than re-deriving class strings
from the original by eye.

## Beyond the homepage

The original is a one-page site. The real one is not, so the chrome had to grow
past what the original needed:

- `public-shell.tsx` wraps every page a visitor can reach — journal, partner
  profiles, legal, the whole `/book` flow, and the member area. Admin, partner,
  and viewer dashboards deliberately stay outside it.
- `nav-links.ts` is the single list of what the nav and footer point at.
  `sectionHref` makes a homepage anchor work from another route, where a bare
  `#philosophy` would resolve against the current page and do nothing.
- `SiteNav` floats over the hero on the homepage and is sticky everywhere else,
  and it carries signed-in state — the original had a static "Sign in" link,
  which showed to signed-in members too.
