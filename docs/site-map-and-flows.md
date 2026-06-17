# The Wellness Korea — Site Map & Flows

Last updated: 2026-06-16

Companion docs: [Backend](./backend-architecture.md) · [DB schema](./database-schema.md) · [ERD](./database-erd.md)

## Domains

| URL | Role | Notes |
|-----|------|-------|
| `https://thewellnesskorea.com` | **Primary (production)** | Redirects to `www` (308) per Vercel |
| `https://www.thewellnesskorea.com` | **Production site** | Vercel Production target |
| `https://thewellnesskorea-tk77.vercel.app` | Vercel default | Stays valid; same deployment, backup URL |
| `http://localhost:3000` | Local dev | `.env.local` |

**After Gabia DNS propagates and Vercel Domains show Valid:**

- The **same app** is served on custom domain and `.vercel.app`.
- Public links, magic links, and admin notification emails should use `NEXT_PUBLIC_SITE_URL` (`https://thewellnesskorea.com`).
- The Vercel URL does not disappear; both work until you remove the default domain.

**DNS (Gabia):**

| Type | Host | Value |
|------|------|-------|
| A | `@` | `76.76.21.21` |
| CNAME | `www` | `cname.vercel-dns.com.` |

---

## URL structure (current build)

### Public site

| Path | Description |
|------|-------------|
| `/` | Homepage: Hero, Philosophy, Paths, Guides, Artists, Schedule (mock data), Footer |
| `/#guides` | Guides section (anchor) |
| `/#artists` | Artists section (anchor) |
| `/#schedule` | Schedule section (anchor; public schedule still mock) |

Published people only: `is_published = true` and `registration_status` in (`admin`, `approved`).

### Teacher self-registration (`/apply`)

| Path | Auth | Description |
|------|------|-------------|
| `/apply` | No | Invite code + email → request magic link |
| `/apply/check-email` | No | “Check your email” confirmation |
| `/auth/callback` | — | Supabase magic-link callback → redirects to profile |
| `/apply/profile` | Yes (magic link) | Full profile form (same fields as admin person form) |
| `/apply/profile/submitted` | Yes | Submission success message |

**Invite code:** `TEACHER_APPLY_CODE` env (default `twk2026`).

### Admin

| Path | Auth | Description |
|------|------|-------------|
| `/admin/login` | No | Email + password (Supabase Auth) |
| `/admin` | Admin | Redirects to `/admin/people` |
| `/admin/people` | Admin | People list, filters, copy apply link |
| `/admin/people/new` | Admin | Create person manually (`registration_status = admin`) |
| `/admin/people/[id]/edit` | Admin | Edit person; review panel for self-registered profiles |
| `/admin/schedule` | Admin | Week / day / month schedule; session processing/confirmed workflow |

Teachers (`app_metadata.role = teacher`) are redirected to `/apply/profile` if they hit `/admin/*`.

---

## User flows

### Flow A — Visitor (public)

```
https://www.thewellnesskorea.com/
  → Browse guides / artists (published only)
  → Schedule section (mock data until public schedule API wired)
```

### Flow B — Admin: manual person

```
/admin/login
  → /admin/people
  → /admin/people/new
  → Save (registration_status = admin)
  → Optional: Publish on site (no approval required)
```

### Flow C — Teacher: self-registration

```
/apply
  → Enter code (twk2026) + email
  → /apply/check-email
  → Click magic link in email
  → /auth/callback → /apply/profile
  → Fill profile + programs
  → [임시 저장] → draft
  → [제출하기] → submitted + email/Slack to all admin Auth users
  → /apply/profile/submitted
```

**Email link:** If `people.email` already exists, profile links to that row on first login.

**After approval:** Admin opens `/admin/people/[id]/edit` → 승인 → Publish when ready.

**Re-edit after approval:** Teacher saves → `submitted` again, `is_published = false`, admins notified again.

### Flow D — Admin: review self-registered teacher

```
/admin/people (filter: Pending review / Self-registered)
  → Edit
  → Review panel: 승인 / 반려
  → Publish checkbox (only when status is admin or approved)
```

### Flow E — Admin: schedule session

```
/admin/schedule
  → Click slot → create session (status: processing)
  → Up to 2 processing sessions per floor+time slot (50% width each)
  → Confirm session → confirmed; competitors auto-cancelled
  → Publish when confirmed (public site revalidate)
```

---

## Person `registration_status`

| Status | Meaning | Visible on homepage |
|--------|---------|---------------------|
| `admin` | Created by admin | Only if `is_published` |
| `draft` | Teacher writing | No |
| `submitted` | Awaiting review | No |
| `approved` | Admin approved | Only if `is_published` |
| `rejected` | Returned to teacher | No |

## Session `status` (schedule)

| Status | UI |
|--------|-----|
| `processing` | Half width, amber, “Processing” ribbon |
| `confirmed` | Full width, blue ribbon; publishable |
| `cancelled` | Hidden from admin grid |

---

## Environment variables

### Local (`.env.local`)

| Variable | Example |
|----------|---------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role (server only) |
| `NEXT_PUBLIC_SITE_URL` | `http://localhost:3000` |
| `TEACHER_APPLY_CODE` | `twk2026` |
| `RESEND_API_KEY` | Resend API key |
| `NOTIFY_FROM_EMAIL` | `onboarding@resend.dev` (test) or verified domain |
| `SLACK_WEBHOOK_URL` | Optional |

### Vercel (Production)

Same keys; `NEXT_PUBLIC_SITE_URL` = `https://thewellnesskorea.com`.

Admin notification emails go to **all Supabase Auth users** where `role !== teacher` (not a fixed env email).

### Supabase Auth redirect URLs

```
https://thewellnesskorea.com/auth/callback
https://www.thewellnesskorea.com/auth/callback
http://localhost:3000/auth/callback
```

---

## Infrastructure checklist

- [ ] Gabia DNS: A + CNAME (see above)
- [ ] Vercel Domains: Valid for `thewellnesskorea.com` and `www`
- [ ] Vercel env + Redeploy
- [ ] Supabase migrations `001`–`007` applied
- [ ] Supabase redirect URLs configured

---

## Layouts & components (screen structure)

| Area | Routes | Layout | Key components |
|------|--------|--------|----------------|
| Public | `/` | `app/layout.tsx` | `navbar`, `hero`, `philosophy`, `paths`, `guides`, `artists`, `schedule/*`, `footer/*` |
| Apply | `/apply/*` | root | `apply-login-form`, `teacher-profile-form` |
| Admin | `/admin/*` (except login) | `admin/(dashboard)/layout.tsx` | `admin-people-list`, `person-form`, `person-review-panel`, `schedule-admin-client`, grids |
| Auth | `/auth/callback` | — | route handler only |

**Admin dashboard nav:** People · Schedule · View site · Sign out

**Schedule admin views:** week grid (default), day grid, month calendar — query params `date`, `floor`, `view`

---

## Related files

| Area | Path |
|------|------|
| Teacher apply | `app/apply/`, `components/apply/` |
| Auth callback | `app/auth/callback/route.ts` |
| Admin people | `app/admin/(dashboard)/people/` |
| Admin schedule | `app/admin/(dashboard)/schedule/` |
| Notifications | `lib/notifications/` |
| Migrations | `supabase/migrations/` |
| Backend logic doc | `docs/backend-architecture.md` |

---

## Not yet implemented (reference)

- Public schedule from live `sessions` data (homepage `#schedule` still mock)
- Participant booking
- Resend custom domain (`notify@thewellnesskorea.com`) for multi-admin email delivery in production
