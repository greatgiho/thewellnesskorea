# The Wellness Korea — Backend Architecture & Core Logic

Last updated: 2026-06-16

Companion docs: [Site map](./site-map-and-flows.md) · [DB schema](./database-schema.md) · [ERD](./database-erd.md)

---

## Stack

| Layer | Technology |
|-------|------------|
| Framework | Next.js 16 App Router |
| DB / Auth / Storage | Supabase (Postgres + Auth + Storage) |
| Server mutations | Server Actions (`"use server"`) |
| Email | Resend API |
| Chat alerts | Slack incoming webhook (optional) |
| Deploy | Vercel |

All DB access uses Supabase clients in `lib/supabase/`:

| Client | Use |
|--------|-----|
| `client.ts` | Browser |
| `server.ts` | Server Components, Actions, Route Handlers (cookie session) |
| `service.ts` | Service role — Auth admin API, bypass RLS |
| `middleware.ts` | Session refresh + route guards |

---

## Authentication & roles

### Admin

- **Login:** `/admin/login` — email + password (`supabase.auth.signInWithPassword`)
- **Guard:** middleware on `/admin/*` (except login) requires authenticated user
- **Role:** `app_metadata.role !== "teacher"` → treated as admin (`is_admin_user()` in DB)

### Teacher (self-registration)

- **Login:** magic link OTP — no password (`signInWithOtp`, `shouldCreateUser: true`)
- **Invite gate:** `TEACHER_APPLY_CODE` env must match before OTP is sent
- **Callback:** `/auth/callback` exchanges `code` → session, redirects to `next` (default `/apply/profile`)
- **Role:** on first profile access, `ensureTeacherRole()` sets `app_metadata.role = "teacher"` via service client
- **Guard:** middleware on `/apply/profile/*` requires auth; teachers hitting `/admin/*` redirect to `/apply/profile`

### Auth redirect matrix (middleware)

| Path | Unauthenticated | Teacher | Admin |
|------|-----------------|---------|-------|
| `/apply/profile/*` | → `/apply` | allow | allow |
| `/admin/login` | allow | → `/apply/profile` | → `/admin/people` |
| `/admin/*` (not login) | → `/admin/login` | → `/apply/profile` | allow |

---

## Module map (`lib/`)

```
lib/
├── apply/          Teacher invite config, account ↔ people linking
├── notifications/  Admin email/Slack on profile submit
├── paths/          Static K-wellness philosophy path metadata
├── people/         Person types, queries, persist, validate, registration status
├── schedule/       Session types, KST grid math, layout, images
├── supabase/       Clients + middleware session helper
└── utils.ts        cn() for Tailwind
```

Server Actions live next to routes:

| File | Responsibility |
|------|----------------|
| `app/admin/actions.ts` | Person CRUD, approve/reject, delete, sign-out |
| `app/apply/actions.ts` | Magic link, teacher draft/submit profile |
| `app/admin/schedule/actions.ts` | Session CRUD, confirm, duplicate, delete, photo upload |

---

## Person lifecycle

### Registration status state machine

```
admin ──(admin creates)────────────────────────────────────────► published OK
draft ──(teacher saves draft)──► draft
draft ──(teacher submits)──────► submitted ──(admin approve)──► approved
submitted ──(admin reject)──────► rejected
approved ──(teacher re-saves)──► submitted (unpublish, re-notify)
rejected ──(teacher re-submits)► submitted
```

### Core rules

| Rule | Where enforced |
|------|----------------|
| Homepage visibility | RLS + `getPublishedPeople()`: `is_published` AND `registration_status IN ('admin','approved')` |
| Publish guard | `canPublishPerson()` — only `admin` or `approved` |
| Admin-created person | `registration_status = 'admin'` on insert |
| Teacher always unpublished on save | `is_published = false` in `persistTeacherProfile` |
| Approved teacher re-edit | status → `submitted`, `is_published = false`, admins notified |
| Email uniqueness | DB unique index on `lower(email)`; link-by-email on login |
| One person per auth user | unique partial index on `people.user_id` |
| Delete person | blocked if any `sessions.instructor_id` references them |

### Teacher account linking (`linkTeacherPerson`)

1. If `people.user_id = auth.uid()` → return row
2. Else if `people.email` matches (case-insensitive) → attach `user_id` (error if already linked to another user)
3. Else → `null` (teacher creates new row on first save)

### Validation (`validatePersonInput`)

Required: kind, names, roles, email format, phone, instagram normalize. Programs optional (0 allowed). Each program needs title; path_keys validated against enum.

### Admin notifications (`notifyAdminProfileSubmitted`)

- Fires on **new submit** or **re-submit** (including post-approval edit)
- Recipients: all Auth users where `role !== 'teacher'` (`getAdminNotifyEmails`)
- Channels: Resend email + optional Slack; failures are silent (`Promise.allSettled`)
- Requires `RESEND_API_KEY`, `NOTIFY_FROM_EMAIL`, `SUPABASE_SERVICE_ROLE_KEY`

---

## Schedule session lifecycle

### Status state machine

```
(new) ──► processing ──(confirm)──► confirmed ──(publish)──► public
              │                         │
              └──(competitor confirm)──► cancelled
processing / confirmed ──(admin delete)──► cancelled (soft)
```

### Slot competition (same floor + overlapping time)

| Status | Grid width | Max per bucket | Publishable |
|--------|------------|----------------|-------------|
| `processing` | 50% (`slot_lane` 0 or 1) | 2 | No |
| `confirmed` | 100% (`slot_lane` 0) | 1 per floor+time | Yes (if `is_published`) |
| `cancelled` | hidden | — | No |

### Core rules

| Rule | Enforcement |
|------|-------------|
| Operating hours | 06:00–24:00 KST |
| Path required | ≥1 `path_key` on session |
| Images | max 3 paths; bucket `session-photos` |
| Processing cannot publish | `validateSessionInput` |
| Confirmed cannot revert to processing | `saveSession` |
| Cancelled cannot edit | `saveSession` |
| Confirm | sets `confirmed_at/by`, `slot_lane=0`, auto-cancels overlapping `processing` on same floor+time |
| Instructor conflict | same instructor cannot overlap any non-cancelled session |
| Public read | RLS: `is_published AND status = 'confirmed'` |

### Time handling

- All schedule grid math in **KST** (`lib/schedule/utils.ts`)
- DB stores `timestamptz` via `toKstIso()`

### Cache revalidation

| Action | Paths revalidated |
|--------|-------------------|
| Person save/publish | `/admin/people`, edit page, `/` if published |
| Session save/publish | `/admin/schedule`, `/` if published |

---

## Storage buckets

| Bucket | Public read | Max size | MIME |
|--------|-------------|----------|------|
| `person-photos` | yes | 5 MB | jpeg, png, webp |
| `session-photos` | yes | 5 MB | jpeg, png, webp |

Old files removed on photo replace (person + session actions).

---

## Environment variables (server-side)

| Variable | Purpose |
|----------|---------|
| `SUPABASE_SERVICE_ROLE_KEY` | Auth admin, list admin emails |
| `TEACHER_APPLY_CODE` | Teacher invite gate |
| `NEXT_PUBLIC_SITE_URL` | Magic link redirect, notification links |
| `RESEND_API_KEY` | Admin alert email |
| `NOTIFY_FROM_EMAIL` | From address |
| `SLACK_WEBHOOK_URL` | Optional Slack |

See [site-map-and-flows.md](./site-map-and-flows.md) for full env + infra checklist.

---

## Security model summary

- **RLS enabled** on all app tables; public policies are read-only for published data
- **Admin** = JWT `app_metadata.role` is not `teacher` (default unset counts as admin)
- **Teacher** = own `people` row + own `person_programs` only; cannot publish
- **Service role** used only server-side for role assignment and admin email discovery
- Middleware is **not** a substitute for RLS — both apply

---

## Related source files

| Area | Path |
|------|------|
| Admin person actions | `app/admin/actions.ts` |
| Teacher apply actions | `app/apply/actions.ts` |
| Schedule actions | `app/admin/schedule/actions.ts` |
| Auth callback | `app/auth/callback/route.ts` |
| Middleware entry | `middleware.ts`, `lib/supabase/middleware.ts` |
| Person persist/validate | `lib/people/persist.ts`, `validate.ts` |
| Registration helpers | `lib/people/registration-status.ts` |
| Teacher linking | `lib/apply/teacher-person.ts` |
| Notifications | `lib/notifications/` |
| Schedule layout/status | `lib/schedule/layout.ts`, `session-status.ts` |

---

## Not yet implemented

- Public homepage schedule from live `sessions` (still mock in `components/schedule/`)
- Participant booking / `booked_count` increment
- Notify creators when their processing session is auto-cancelled on confirm
- Resend verified domain for production multi-admin delivery
