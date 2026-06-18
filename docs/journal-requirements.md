# Journal — Requirements

Last updated: 2026-06-18

Companion: [Site map](./site-map-and-flows.md) · [Multi-experience requirements](./multi-venue-requirements.md) · [DB schema](./database-schema.md)

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

| Key | Label (EN) |
|-----|------------|
| `all` | All |
| `philosophy` | Philosophy |
| `space` | Space |
| `programs` | Programs |
| `news` | News |

Implementation: `lib/journal/copy.ts`

---

## 5. Data model (planned — Phase J2)

Table: **`journal_posts`**

| Column | Purpose |
|--------|---------|
| `slug` | URL segment |
| `title_en`, `title_ko` | Headline |
| `excerpt_en` | Card summary |
| `body_en` | Markdown or JSON blocks |
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
| **J1** | Routes, Navbar/Footer links, static fallback posts, list + detail UI | **Deferred** — nav hidden; `/journal` routes remain in codebase |
| **J2** | `journal_posts` migration + RLS + Supabase queries | Pending |
| **J3** | Admin CRUD + image upload | Pending |
| **J4** | Category filter (DB), related posts, FAQ blocks | Pending |

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
