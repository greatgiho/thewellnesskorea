# The Wellness Korea — Database Schema

Last updated: 2026-06-16

Source of truth: `supabase/migrations/001`–`007`

Companion: [ERD](./database-erd.md) · [Backend logic](./backend-architecture.md) · [Site map](./site-map-and-flows.md)

> 목적: 데이터베이스 물리/논리 스키마 명세

**Apply order:** `001` → `002` → `003` → `004` → `005` → `007` → `008`  
(`007_fix_duplicate_emails.sql` = idempotent superset of `006`; use `007` if emails may duplicate)

---

## Custom enums

| Enum | Values | Used in |
|------|--------|---------|
| `person_kind` | `guide`, `artist`, `both` | `people.kind` |
| `path_key` | `bium`, `kkaeum`, `jieum`, `chaeum`, `nurim` | `person_programs.path_keys`, `sessions.path_keys` |
| `session_status` | `processing`, `confirmed`, `cancelled` | `sessions.status` |
| `person_registration_status` | `admin`, `draft`, `submitted`, `approved`, `rejected` | `people.registration_status` |

---

## Tables

### `people`

Guide/Artist master profile.

| Column | Type | Constraints / default |
|--------|------|----------------------|
| `id` | uuid | PK, `gen_random_uuid()` |
| `slug` | text | UNIQUE, NOT NULL |
| `kind` | person_kind | NOT NULL |
| `name_ko`, `name_en` | text | NOT NULL |
| `role_ko`, `role_en` | text | NOT NULL |
| `quote` | text | nullable |
| `modalities` | text[] | default `{}` (legacy; programs preferred) |
| `phone`, `email`, `instagram` | text | nullable |
| `photo_path` | text | nullable → `person-photos` bucket |
| `sort_order` | int | default 0 |
| `is_published` | boolean | default false |
| `user_id` | uuid | FK → `auth.users`, ON DELETE SET NULL |
| `registration_status` | person_registration_status | default `admin` |
| `submitted_at` | timestamptz | nullable |
| `reviewed_at` | timestamptz | nullable |
| `reviewed_by` | uuid | FK → `auth.users` |
| `rejection_reason` | text | nullable |
| `created_at`, `updated_at` | timestamptz | `updated_at` via trigger |

**Indexes**

- `people_kind_published_idx` — `(kind, is_published, sort_order)`
- `people_registration_status_idx` — `(registration_status, updated_at DESC)`
- `people_user_id_unique_idx` — UNIQUE `(user_id)` WHERE `user_id IS NOT NULL`
- `people_email_unique_idx` — UNIQUE `(lower(email))` WHERE email not empty

**Triggers:** `people_updated_at` → `set_updated_at()`

---

### `person_programs`

| Column | Type | Constraints / default |
|--------|------|----------------------|
| `id` | uuid | PK |
| `person_id` | uuid | FK → `people`, ON DELETE CASCADE |
| `title` | text | NOT NULL |
| `description` | text | nullable |
| `path_keys` | path_key[] | default `{}` |
| `sort_order` | int | default 0 |
| `created_at` | timestamptz | default now() |

**Index:** `person_programs_person_idx` — `(person_id, sort_order)`

---

### `floors`

Seeded: 1F–4F (`slug` `1f`…`4f`, `level` 1–4).

| Column | Type | Constraints |
|--------|------|-------------|
| `id` | uuid | PK |
| `slug` | text | UNIQUE |
| `level` | smallint | UNIQUE, CHECK 1–4 |
| `name_ko`, `name_en` | text | NOT NULL |
| `sort_order` | int | default 0 |

---

### `sessions`

| Column | Type | Constraints / default |
|--------|------|----------------------|
| `id` | uuid | PK |
| `floor_id` | uuid | FK → `floors`, ON DELETE RESTRICT |
| `instructor_id` | uuid | FK → `people`, ON DELETE RESTRICT |
| `person_program_id` | uuid | FK → `person_programs`, ON DELETE SET NULL |
| `title` | text | NOT NULL |
| `path_keys` | path_key[] | default `{}` |
| `starts_at`, `ends_at` | timestamptz | CHECK `ends_at > starts_at` |
| `capacity` | int | CHECK `> 0` |
| `booked_count` | int | default 0, CHECK `>= 0` |
| `is_published` | boolean | default false |
| `status` | session_status | default `processing` |
| `slot_lane` | smallint | default 0, CHECK 0–1 |
| `confirmed_at` | timestamptz | nullable |
| `confirmed_by` | uuid | FK → `auth.users` |
| `created_by` | uuid | FK → `auth.users` |
| `created_by_email` | text | nullable |
| `cancelled_at` | timestamptz | nullable |
| `cancelled_by` | uuid | FK → `auth.users` |
| `cancel_reason` | text | nullable |
| `image_paths` | text[] | default `{}`, max 3 (CHECK) |
| `description_blocks` | jsonb | `{ intro, progress, preparation }` |
| `created_at`, `updated_at` | timestamptz | trigger on update |

**Indexes:** `(floor_id, starts_at)`, `(instructor_id, starts_at)`, `(starts_at)`, `(status, starts_at)`

**Triggers:** `sessions_updated_at` → `set_updated_at()`

---

## Database functions

| Function | Purpose |
|----------|---------|
| `set_updated_at()` | Trigger: bump `updated_at` on `people`, `sessions` |
| `is_admin_user()` | RLS: `(jwt app_metadata.role) IS DISTINCT FROM 'teacher'` |

---

## Row Level Security

RLS **enabled** on all four app tables.

### `people`

| Policy | Op | Rule |
|--------|-----|------|
| public read published people | SELECT | `is_published AND registration_status IN ('admin','approved')` |
| admin all on people | ALL | `is_admin_user()` |
| teacher read own people | SELECT | `user_id = auth.uid()` |
| teacher insert own people | INSERT | `user_id = auth.uid()`, status `draft`\|`submitted`, not published, no duplicate user row |
| teacher update own people | UPDATE | `user_id = auth.uid()`, `is_published = false` |

### `person_programs`

| Policy | Op | Rule |
|--------|-----|------|
| public read programs of published people | SELECT | parent person published + approved/admin |
| admin all on person_programs | ALL | `is_admin_user()` |
| teacher manage own programs | ALL | parent `people.user_id = auth.uid()` |

### `floors`

| Policy | Op | Rule |
|--------|-----|------|
| public read floors | SELECT | always true |
| admin all on floors | ALL | authenticated |

### `sessions`

| Policy | Op | Rule |
|--------|-----|------|
| public read published sessions | SELECT | `is_published AND status = 'confirmed'` |
| admin all on sessions | ALL | `is_admin_user()` |
| teacher read own published sessions | SELECT | not admin; `status = confirmed`; `is_published`; `instructor_id` linked to `people.user_id = auth.uid()` |

---

## Storage buckets

| Bucket | Public | Size | MIME | Used by |
|--------|--------|------|------|---------|
| `person-photos` | yes | 5 MB | jpeg, png, webp | `people.photo_path` |
| `session-photos` | yes | 5 MB | jpeg, png, webp | `sessions.image_paths[]` |

**Policies:** anonymous SELECT; authenticated INSERT/UPDATE/DELETE per bucket.

No FK from table columns to `storage.objects` — paths are opaque strings.

---

## External: `auth.users` (Supabase managed)

Referenced by FK (not created in app migrations):

| Column | Referenced from |
|--------|-----------------|
| `id` | `people.user_id`, `people.reviewed_by`, `sessions.created_by`, `confirmed_by`, `cancelled_by` |
| `app_metadata.role` | `teacher` \| `admin` \| unset (admin) |

---

## Migration history

| File | Summary |
|------|---------|
| `001_people.sql` | `people`, `person_kind`, RLS, `person-photos` |
| `002_person_programs.sql` | contact fields, `path_key`, `person_programs`, modality → program migration |
| `003_schedule.sql` | `floors` seed, `sessions` |
| `004_session_content.sql` | `image_paths`, `description_blocks`, `session-photos` |
| `005_session_status.sql` | `session_status`, slot workflow, public session policy |
| `006_teacher_self_registration.sql` | registration columns, teacher RLS (may fail on dup email) |
| `007_fix_duplicate_emails.sql` | idempotent 006 + email dedupe + unique index |
| `008_teacher_sessions_rls.sql` | admin sessions policy via `is_admin_user()`; teacher read own confirmed+published sessions |

---

## Not yet implemented (schema)

- `bookings` / payments
- Session waitlist
- Audit log table
