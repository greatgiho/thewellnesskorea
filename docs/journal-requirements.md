# Journal — Requirements

Last updated: 2026-06-17

Companion: [Site map](./site-map-and-flows.md) · [Multi-experience requirements](./multi-venue-requirements.md) · [Platform Discover plan](./platform-discovery-plan.md) · [DB schema](./database-schema.md)

> Public long-form content: platform stories, Spaces, guides, and programs.  
> Reference UX: [Mindcarelab blog index](https://www.mindcarelab.co.kr/sensory-room/blog) · [article detail](https://www.mindcarelab.co.kr/sensory-room/blog/comfort-lounge-snoezelen)

---

## 1. Naming & URLs (confirmed)

| Surface | Value |
|---------|--------|
| Public label | **Journal** (not Magazine) |
| Index | `/journal` |
| Article | `/journal/[slug]` |
| Navbar | Link to `/journal` — **not** a homepage anchor |
| Footer | Brand → Journal → `/journal` |

---

## 2. Product scope

| Layer | Role |
|-------|------|
| **Platform** | Journal is platform-wide in v1 (not per-experience URL prefix) |
| **Experience** | Optional `experience_id` FK in v2 to tag Space/Journey stories |
| **Homepage** | Journal is a separate route; homepage sections unchanged |

---

## 3. User-facing requirements

### 3.1 Index `/journal`

| ID | Requirement |
|----|-------------|
| J-01 | Card grid: hero image, title, excerpt, date, read time |
| J-02 | Category filter tabs (All + editorial categories) |
| J-03 | Pagination when post count grows (v1: single page OK) |
| J-04 | Only `is_published = true` posts |
| J-05 | Entry from Navbar and Footer |

### 3.2 Article `/journal/[slug]`

| ID | Requirement |
|----|-------------|
| A-01 | SEO title + description + OG image |
| A-02 | Eyebrow **Journal** + title + meta line (date · read time) |
| A-03 | Hero image + long-form body (headings, quotes, images) |
| A-03b | Footer **Partner tags** — photo + name → `/people/[slug]` (guide, artist, brand) |
| A-04 | (Later) FAQ block, related posts |
| A-05 | 404 when unpublished or missing slug |

### 3.3 Navigation

| ID | Requirement |
|----|-------------|
| N-01 | Navbar **Journal** → `/journal` on all public pages |
| N-02 | Journal pages use shared Navbar + Footer |
| N-03 | Logo → `/` |

---

## 4. Categories (v1)

| Key | Label (EN) | Core pillar |
|-----|------------|-------------|
| `all` | All | — |
| `philosophy` | Philosophy | Platform |
| `space` | Space | Flexible Stage |
| `programs` | Programs | Guides / Artists |
| `news` | News | Platform |
| `region` | Local Discovery | **Core — local tourism** |
| `taste` | Local Taste | **Core — F&B** |

Implementation: `lib/journal/copy.ts`

Homepage **Discover teaser** (Phase D2) links to `region` and `taste` only. See [Platform Discover plan](./platform-discovery-plan.md).

---

## 4.1 Editor input (confirmed — Phase D1)

| Decision | Choice |
|----------|--------|
| Primary CMS | **Admin CRUD** at `/admin/journal` (same stack as People / Schedule) |
| Body format | **TipTap WYSIWYG** → sanitized HTML in `body_en` text column |
| Hero image | Upload to `journal-photos` bucket (`{postId}/hero.*`) |
| Inline images | Toolbar insert → `journal-photos` (`{postId}/inline/{uuid}.*`) |
| Partner tags | Multi-select partners (guide / artist / brand) → `journal_post_people` |
| Draft | `is_published = false`; live preview via editor |
| Not v1 | MDX-in-repo, Notion/Sanity |

Full field list and workflow: [Platform Discover plan §4](./platform-discovery-plan.md#4-journal-input--how-editors-publish).

---

## 5. Data model (planned — Phase J2)

Table: **`journal_posts`**

| Column | Purpose |
|--------|---------|
| `slug` | URL segment |
| `title_en`, `title_ko` | Headline |
| `excerpt_en` | Card summary |
| `body_en` | TipTap HTML (legacy Markdown still renders until migrated) |
| `hero_image_path` | Cover / OG |
| `category` | enum |
| `published_at` | Display date |
| `read_minutes` | Estimated read time |
| `is_published` | Public gate |
| `experience_id` | Optional FK → `experiences` (v2) |
| `seo_title`, `seo_description` | Optional override |

Storage bucket: `journal-photos` (Phase J3) or public paths initially.

---

## 6. Implementation phases

| Phase | Scope | Status |
|-------|--------|--------|
| **J1** | Routes, static fallback posts, list + detail UI | **Done** (nav still hidden) |
| **J2** | `journal_posts` migration + RLS + categories `region`/`taste` | **Done** (`014`) |
| **J3** | Admin CRUD + hero/inline upload + TipTap editor + Navbar/Footer Journal link | **Done** |
| **J4** | Category filter from URL, related posts, FAQ blocks | Pending |

---

## 7. Out of scope (v1)

- Per-experience URL prefix (`/brickwell/journal/...`)
- MDX in repo as primary CMS
- Comments / newsletter on journal pages
- Full Mindcarelab FAQ + related parity (J4)

---

## 8. Changelog

| Date | Notes |
|------|-------|
| 2026-06-18 | Journal naming confirmed; J1 scaffold + this doc |
| 2026-06-18 | Journal deferred — removed from Navbar/Footer until J2/J3 |
| 2026-06-17 | Partner tags on articles (`journal_post_people`); Admin **Partners** tab with Guide/Artist/Brand + philosophy filters; `brand` person kind |
