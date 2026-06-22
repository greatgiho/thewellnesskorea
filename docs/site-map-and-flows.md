# The Wellness Korea — Site Map & Flows

Last updated: 2026-06-17

Companion docs: [Backend](./backend-architecture.md) · [DB schema](./database-schema.md) · [ERD](./database-erd.md) · [Multi-experience requirements](./multi-venue-requirements.md) · [Journal requirements](./journal-requirements.md) · [Platform Discover plan](./platform-discovery-plan.md) · [Booking requirements](./booking-requirements.md)

> 목적: 전체 서비스의 지도 및 흐름 파악 (신규 개발자 온보딩용)

---

## Infrastructure overview

```mermaid
flowchart LR
    subgraph client [Clients]
        B[Browser]
    end
    subgraph vercel [Vercel]
        N[Next.js 16 App]
    end
    subgraph supabase [Supabase]
        PG[(Postgres + RLS)]
        AU[Auth]
        ST[Storage]
    end
    subgraph external [External]
        R[Resend]
        S[Slack Webhook]
    end
    B --> N
    N --> PG
    N --> AU
    N --> ST
    N --> R
    N --> S
```

| Service | Role |
|---------|------|
| **Vercel** | Hosting, Production deploy, custom domain |
| **Supabase** | Postgres DB, Auth (admin password / teacher register magic link + portal password), file storage |
| **Gabia DNS** | `thewellnesskorea.com` → Vercel |
| **Resend** | Admin alerts on profile submit; teacher account credentials |
| **Slack** | Optional webhook alert (same event) |

### Domains

| URL | Role |
|-----|------|
| `https://thewellnesskorea.com` | Primary; 308 redirect to `www` (Vercel) |
| `https://www.thewellnesskorea.com` | Production site |
| `https://thewellnesskorea-tk77.vercel.app` | Vercel default (backup) |
| `http://localhost:3000` | Local dev |

**DNS (Gabia):** A `@` → `76.76.21.21` · CNAME `www` → `cname.vercel-dns.com.`

Public links, magic links, notification URLs → `NEXT_PUBLIC_SITE_URL`.

---

## Active URL map

모든 App Router 엔트리.

| URL | File | Auth | Description |
|-----|------|------|-------------|
| `/` | `app/page.tsx` | Public | Homepage |
| `/partners/[slug]` | `app/partners/[slug]/page.tsx` | Public | Partner profile + upcoming sessions |
| `/login` | `app/login/page.tsx` | Public | Member login |
| `/signup` | `app/signup/page.tsx` | Public | Member signup |
| `/login/check-email` | `app/login/check-email/page.tsx` | Public | Member magic-link sent |
| `/account` | `app/account/page.tsx` | Member | Account home |
| `/account/bookings` | `app/account/bookings/page.tsx` | Member | Member bookings list |
| `/book/[sessionId]` | `app/book/[sessionId]/page.tsx` | Public | Guest/member booking form |
| `/book/confirm` | `app/book/confirm/page.tsx` | Public | Booking confirmation |
| `/book/cancel/[token]` | `app/book/cancel/[token]/page.tsx` | Public | Guest cancel by token |
| `/book/cancelled` | `app/book/cancelled/page.tsx` | Public | Cancel success |
| `/journal` | `app/journal/page.tsx` | Public | Journal index (`?category=` filter) |
| `/journal/[slug]` | `app/journal/[slug]/page.tsx` | Public | Journal article |
| `/privacy` | `app/privacy/page.tsx` | Public | Privacy policy |
| `/terms` | `app/terms/page.tsx` | Public | Terms of service |
| `/site-unlock` | `app/site-unlock/page.tsx` | Public (when lock enabled) | Preview password gate |
| `/apply` | `app/apply/page.tsx` | Public | Teacher invite + email |
| `/apply/check-email` | `app/apply/check-email/page.tsx` | Public | Magic link sent confirmation |
| `/apply/profile` | `app/apply/profile/page.tsx` | Teacher session | Profile create/edit (registration) |
| `/apply/profile/submitted` | `app/apply/profile/submitted/page.tsx` | Teacher session | Submit success |
| `/auth/callback` | `app/auth/callback/route.ts` | — | Magic-link: `token_hash` or `code` → session |
| `/teacher/login` | `app/teacher/login/page.tsx` | Public | Teacher email + password |
| `/teacher` | `app/teacher/(dashboard)/page.tsx` | Teacher | Upcoming schedule dashboard |
| `/teacher/settings` | `app/teacher/(dashboard)/settings/page.tsx` | Teacher | Password change + reissue |
| `/teacher/change-password` | `app/teacher/change-password/page.tsx` | Teacher | Forced password change after temp login |
| `/admin/login` | `app/admin/login/page.tsx` | Public | Admin email + password |
| `/admin` | `app/admin/(dashboard)/page.tsx` | Admin | → redirect `/admin/partners` |
| `/admin/partners` | `app/admin/(dashboard)/partners/page.tsx` | Admin | Partners list |
| `/admin/partners/new` | `app/admin/(dashboard)/partners/new/page.tsx` | Admin | Manual partner create (+ account if email) |
| `/admin/partners/[id]` | `app/admin/(dashboard)/partners/[id]/page.tsx` | Admin | Read-only profile (incl. activity regions) |
| `/admin/partners/[id]/edit` | `app/admin/(dashboard)/partners/[id]/edit/page.tsx` | Admin | Edit + review + account panel |
| `/admin/schedule` | `app/admin/(dashboard)/schedule/page.tsx` | Admin | Schedule admin |
| `/admin/bookings` | `app/admin/(dashboard)/bookings/page.tsx` | Admin | Bookings list |
| `/admin/journal` | `app/admin/(dashboard)/journal/page.tsx` | Admin | Journal list |
| `/admin/journal/new` | `app/admin/(dashboard)/journal/new/page.tsx` | Admin | New journal post |
| `/admin/journal/[id]/edit` | `app/admin/(dashboard)/journal/[id]/edit/page.tsx` | Admin | Edit journal post |

**Legacy redirects (`next.config.mjs`):** `/people/:slug` → `/partners/:slug` · `/admin/people/*` → `/admin/partners/*`

**Homepage anchors (same page):** `/#guides` · `/#artists` · `/#schedule`

**Schedule admin query params:** `date` (YYYY-MM-DD) · `floor` (floor slug) · `view` (`week` \| `day` \| `month`)

**Middleware matcher:** all app routes except static assets (`_next/static`, images). Order: **site preview lock** (`SITE_ACCESS_PASSWORD`) → Supabase session guards. Bypass: `/site-unlock`, `/auth/callback`, auth query params (`code`, `token_hash`+`type`). If Supabase lands on `/?code=...`, middleware forwards to `/apply/profile` flow via auth handler.

**Site preview lock:** set `SITE_ACCESS_PASSWORD` in Vercel Production only. Cookie `twk_site_access` (14 days). Remove env to launch publicly.

---

## Screen & component hierarchy

### Layout tree

```
app/layout.tsx                    ← root: fonts, metadata, Analytics
├── /                             app/page.tsx
├── /apply/*                      (no nested layout)
├── /auth/callback                route handler
├── /partners/[slug]              public profile + upcoming sessions
├── /book/*                       guest/member booking flow
├── /login · /signup · /account/* member auth + bookings
├── /privacy · /terms             legal pages
├── /teacher/login                app/teacher/login/page.tsx
├── /teacher/change-password      app/teacher/change-password/page.tsx
├── /teacher/(dashboard)/*        app/teacher/(dashboard)/layout.tsx
│   ├── /teacher                  upcoming schedule
│   └── /teacher/settings         password + reissue
└── /admin/login                  app/admin/login/page.tsx
    └── /admin/(dashboard)/*      app/admin/(dashboard)/layout.tsx
        ├── /admin/partners
        ├── /admin/partners/new
        ├── /admin/partners/[id]/edit
        └── /admin/schedule
```

### Public homepage (`/`)

```
page.tsx
├── Navbar
├── ExperienceHomeProvider     ← getPublishedExperiences() (+ FALLBACK_EXPERIENCES)
│   ├── HeroCarousel           ← horizontal swipe per experience (components/experiences/*)
│   ├── Philosophy
│   ├── WhyKorea
│   ├── Paths
│   │   ├── path-section
│   │   └── path-card
│   ├── Guides                 ← getPublishedPartners("guide")
│   │   ├── partner-section
│   │   └── partner-card → /partners/[slug]
│   ├── Artists                ← getPublishedPartners("artist")
│   │   └── partner-card → /partners/[slug]
│   └── Schedule               ← synced horizontal swipe; mock classes for schedule_enabled
│       ├── schedule-section
│       ├── schedule-experience-panel (Brickwell)
│       └── schedule-empty-state (Coming soon)
├── ClosingCta
└── Footer
    ├── footer-brand-column
    ├── footer-link-columns
    ├── footer-social-links
    └── footer-bottom-bar
```

### Teacher apply (`/apply`)

| Screen | Components |
|--------|------------|
| `/apply` | `apply-login-form` |
| `/apply/check-email` | inline confirmation UI |
| `/apply/profile` | `teacher-profile-form` (+ `activity-region-fields`, `program-list-editor`, `philosophy-path-picker`) |
| `/apply/profile/submitted` | inline success UI |

### Teacher portal (`/teacher`)

| Screen | Components |
|--------|------------|
| `/teacher/login` | `teacher-login-form` |
| `/teacher/change-password` | `change-password-form` (forced) |
| Layout | greeting, nav: Settings · Sign out |
| `/teacher` | `teacher-upcoming-schedule` → `teacher-session-card`, `teacher-session-detail` (dialog) |
| `/teacher/settings` | `change-password-form`, `password-reissue-button` |

### Admin dashboard

| Screen | Components |
|--------|------------|
| Layout | nav: Partners · Schedule · Journal · Bookings · View site · Sign out |
| `/admin/partners` | `admin-partners-list` (search, status/path filters, apply link) |
| `/admin/partners/new` | `partner-form`, `activity-region-fields`, `program-list-editor` |
| `/admin/partners/[id]` | `partner-detail-view` (activity regions) |
| `/admin/partners/[id]/edit` | `partner-form`, `activity-region-fields`, `partner-review-panel`, `partner-account-panel`, `delete-partner-button` |
| `/admin/schedule` | `schedule-admin-client` |
| | → `schedule-period-picker` (month/week jump popover) |
| | → `schedule-floor-nav`, `schedule-week-grid` / `schedule-day-grid` / `schedule-month-calendar` |
| | → `schedule-session-block`, `session-form-dialog`, `session-description-fields`, `session-image-upload`, `instructor-search-picker` |

---

## User flows

### Flow A — Visitor (public)

```
/ → Hero + Schedule (experiences from DB; horizontal sync)
  → Guides / Artists (DB: published + approved/admin only)
  → #schedule (mock for Brickwell; coming soon empty state for next-space)
```

### Flow B — Admin: manual person

```
/admin/login → /admin/partners → /admin/partners/new
  → Save with email (registration_status = admin) → Auth account + temp password email
  → Publish optional (no approval required)
```

### Flow C — Teacher self-registration

```
/apply → code + email → /apply/check-email
  → magic link → `/auth/callback?token_hash=…` (any device) or `?code=…` → `/apply/profile`
  → /apply/profile (linkTeacherPartner by email if exists)
  → [임시 저장] draft | [제출하기] submitted + admin notify
  → /apply/profile/submitted
```

Post-approval re-edit → `submitted`, unpublish, re-notify admins.

### Flow D — Admin: review teacher

```
/admin/partners (filter: Pending / Self-registered)
  → /admin/partners/[id]/edit → 승인 | 반려
  → 승인 시: Auth account + temp password email (email required)
  → Publish when admin or approved
```

### Flow F — Teacher portal (schedule)

```
/teacher/login (email + temp password from Resend)
  → must_change_password ? /teacher/change-password : /teacher
  → Upcoming: sessions where instructor = self, status = confirmed, is_published, starts_at >= now
  → Card click → session detail dialog
  → /teacher/settings: change password | reissue temp password email
```

### Flow E — Admin: schedule

```
/admin/schedule → click slot → create (processing, 50% width)
  → max 2 processing per floor+overlap bucket
  → Confirm → confirmed (100%), competitors cancelled
  → Revert to processing → unpublish, 50% width; cancelled competitors not restored
  → Publish when confirmed → revalidate /
```

---

## Domain enums (UI reference)

### Partner `registration_status`

| Status | Homepage visible |
|--------|------------------|
| `admin` | Only if `is_published` |
| `draft` | No |
| `submitted` | No |
| `approved` | Only if `is_published` |
| `rejected` | No |

### Session `status`

| Status | Admin grid |
|--------|------------|
| `processing` | 50% width, amber ribbon |
| `confirmed` | 100% width, blue ribbon; publishable |
| `cancelled` | Hidden |

---

## Environment variables

기준: `.env.local.example`. **시크릿 값은 문서·커밋에 포함하지 않음.**

| Variable | Scope | Purpose |
|----------|-------|---------|
| `NEXT_PUBLIC_SUPABASE_URL` | client + server | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | client + server | Anon key (RLS-bound) |
| `SUPABASE_SERVICE_ROLE_KEY` | server only | Auth admin API, admin email discovery |
| `NEXT_PUBLIC_SITE_URL` | client + server | Magic link redirect, notification links |
| `TEACHER_APPLY_CODE` | server | Teacher invite gate (default `twk2026`) |
| `RESEND_API_KEY` | server | Profile submit email |
| `NOTIFY_FROM_EMAIL` | server | Resend from address |
| `SLACK_WEBHOOK_URL` | server | Optional Slack alert |
| `SITE_ACCESS_PASSWORD` | server | Optional whole-site preview lock (Production); omit locally |

**Production:** same keys; `NEXT_PUBLIC_SITE_URL` = `https://thewellnesskorea.com`. Set `SITE_ACCESS_PASSWORD` until public launch, then remove and redeploy.

Admin notify recipients: Supabase Auth users where `app_metadata.role = "admin"` (no fixed env email).

**Supabase Auth redirect URLs:**

```
https://thewellnesskorea.com/auth/callback
https://www.thewellnesskorea.com/auth/callback
http://localhost:3000/auth/callback
```

**Scripts (optional, not in .env.example):** `ADMIN_EMAIL`, `ADMIN_PASSWORD` for `npm run create-admin`. Admin role backfill: `npm run set-admin-role -- email@…` (one user) or `npm run backfill-admin-roles -- --apply` (all unset, non-teacher, non-member).

---

## Deployment checklist

- [ ] Gabia DNS: A + CNAME
- [ ] Vercel Domains: Valid (`thewellnesskorea.com`, `www`)
- [ ] Vercel env vars + Redeploy (incl. optional `SITE_ACCESS_PASSWORD` for preview)
- [ ] Supabase migrations `001`–`022` applied (`021` then `022` for B7 payments)
- [ ] Supabase redirect URLs
- [ ] Resend: verify domain for multi-admin production email

---

## Source index

| Area | Path |
|------|------|
| Teacher apply | `app/apply/`, `components/apply/` |
| Auth callback | `app/auth/callback/route.ts` |
| Middleware | `middleware.ts`, `lib/supabase/middleware.ts`, `lib/site-access.ts` |
| Site preview lock | `app/site-unlock/`, `components/site-unlock-form.tsx` |
| Admin partners | `app/admin/(dashboard)/partners/`, `app/admin/actions.ts`, `components/admin/admin-partners-list.tsx` — kind filter: Guide / Artist / Brand + philosophy paths |
| Public partners | `app/partners/[slug]/`, `components/partners/` |
| Admin journal | `app/admin/(dashboard)/journal/`, `app/admin/journal/actions.ts`, `components/admin/journal-form.tsx`, `components/admin/journal-editor.tsx`, `components/admin/journal-partner-picker.tsx` |
| Public journal | `app/journal/`, `components/journal/`, `lib/journal/` |
| Public journal partners | `components/journal/journal-partner-tags.tsx` → links `/partners/[slug]` |
| Admin schedule | `app/admin/(dashboard)/schedule/`, `app/admin/schedule/actions.ts` |
| Bookings | `app/book/`, `app/account/bookings/`, `app/admin/(dashboard)/bookings/`, `lib/bookings/` |
| B7 payment (planned) | `POST /api/webhooks/payment` (webhook), Vercel Cron → `expire_stale_booking_holds` |
| Notifications | `lib/notifications/` |
| Migrations | `supabase/migrations/` |

---

## Not yet implemented

- Public `#schedule` from live `sessions` — **done** (B1)
- Participant booking (hybrid guest + member Auth) — [booking-requirements](./booking-requirements.md)
- Resend verified domain for production multi-recipient delivery
