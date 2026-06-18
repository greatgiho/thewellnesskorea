# The Wellness Korea — Database Schema

Last updated: 2026-06-18

Source of truth: `supabase/migrations/001`–`011`

Companion: [ERD](./database-erd.md) · [Backend logic](./backend-architecture.md) · [Site map](./site-map-and-flows.md) · [Multi-experience requirements](./multi-venue-requirements.md) · [Audit log](./architecture-audit-log.md)

> 목적: 데이터베이스 물리/논리 스키마 명세

**Apply order:** `001` → `002` → `003` → `004` → `005` → `007` → `008` → `009` → `010` → `011`  
(`007_fix_duplicate_emails.sql` = idempotent superset of `006`; use `007` if emails may duplicate)

---

## Custom enums

| Enum | Values | Used in |
|------|--------|---------|
| `person_kind` | `guide`, `artist`, `both` | `people.kind` |
| `path_key` | `bium`, `kkaeum`, `jieum`, `chaeum`, `nurim` | `person_programs.path_keys`, `sessions.path_keys` |
| `session_status` | `processing`, `confirmed`, `cancelled` | `sessions.status` |
| `person_registration_status` | `admin`, `draft`, `submitted`, `approved`, `rejected` | `people.registration_status` |
| `experience_kind` | `space`, `journey` | `experiences.kind` |

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

### `regions`

Nationwide administrative districts (시·도 + 시·군·구). Seeded in `010_regions_seed.sql` (17 sido, 252 sigungu).

| Column | Type | Constraints / default |
|--------|------|----------------------|
| `code` | text | PK (e.g. `11`, `11110`) |
| `parent_code` | text | FK → `regions`, nullable (sido has null parent) |
| `level` | smallint | CHECK 1–3 (1=sido, 2=sigungu) |
| `name_ko`, `name_en` | text | NOT NULL |
| `sort_order` | int | default 0 |

**Index:** `regions_parent_level_idx` — `(parent_code, level, sort_order)`

---

### `person_activity_regions`

Teacher primary/secondary activity areas (priority 1 required on save).

| Column | Type | Constraints / default |
|--------|------|----------------------|
| `person_id` | uuid | FK → `people`, ON DELETE CASCADE |
| `priority` | smallint | CHECK IN (1, 2); PK `(person_id, priority)` |
| `region_code` | text | FK → `regions` |
| `created_at` | timestamptz | default now() |

**Indexes:** `person_activity_regions_region_idx` — `(region_code)`  
**Unique:** `(person_id, region_code)` — same region cannot be both priorities

---

### `experiences`

Space (long-term venue) or Journey (time-bound program). Hero carousel + schedule branch.

| Column | Type | Constraints / default |
|--------|------|----------------------|
| `id` | uuid | PK |
| `slug` | text | UNIQUE, NOT NULL |
| `kind` | experience_kind | NOT NULL |
| `name_en` | text | NOT NULL |
| `name_ko` | text | nullable |
| `hero_image_path` | text | nullable |
| `headline_en`, `description_en` | text | nullable |
| `secondary_link_label_en`, `secondary_link_href` | text | nullable |
| `sort_order` | int | default 0 |
| `is_published` | boolean | default false |
| `schedule_enabled` | boolean | default false |
| `created_at`, `updated_at` | timestamptz | trigger on update |

**Seed (`011`):** `brickwell` (space, schedule on), `next-space` (space, coming soon).

Eyebrow copy is **frontend-fixed** — see `lib/experiences/copy.ts`.

---

### `floors`

Per-experience building levels. Brickwell: 1F–4F (`slug` `1f`…`4f`).

| Column | Type | Constraints |
|--------|------|-------------|
| `id` | uuid | PK |
| `experience_id` | uuid | FK → `experiences`, NOT NULL |
| `slug` | text | UNIQUE per experience |
| `level` | smallint | UNIQUE per experience, CHECK 1–99 |
| `name_ko`, `name_en` | text | NOT NULL |
| `sort_order` | int | default 0 |

**Unique:** `(experience_id, slug)`, `(experience_id, level)`

---

### `sessions`

| Column | Type | Constraints / default |
|--------|------|----------------------|
| `id` | uuid | PK |
| `experience_id` | uuid | FK → `experiences`, NOT NULL |
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

**Indexes:** `(experience_id, starts_at)`, `(floor_id, starts_at)`, `(instructor_id, starts_at)`, `(starts_at)`, `(status, starts_at)`

**Triggers:** `sessions_updated_at` → `set_updated_at()`

---

## Database functions

| Function | Purpose |
|----------|---------|
| `set_updated_at()` | Trigger: bump `updated_at` on `people`, `sessions`, `experiences` |
| `is_admin_user()` | RLS: `(jwt app_metadata.role) IS DISTINCT FROM 'teacher'` |

---

## Row Level Security

RLS **enabled** on all app tables (`people`, `person_programs`, `floors`, `sessions`, `regions`, `person_activity_regions`, `experiences`).

### `experiences`

| Policy | Op | Rule |
|--------|-----|------|
| public read published experiences | SELECT | `is_published = true` |
| admin all on experiences | ALL | `is_admin_user()` |

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

### `regions`

| Policy | Op | Rule |
|--------|-----|------|
| public read regions | SELECT | always true |
| admin all on regions | ALL | `is_admin_user()` |

### `person_activity_regions`

| Policy | Op | Rule |
|--------|-----|------|
| public read activity regions of published people | SELECT | parent person published + approved/admin |
| admin all on person_activity_regions | ALL | `is_admin_user()` |
| teacher read own activity regions | SELECT | parent `people.user_id = auth.uid()` |
| teacher manage own activity regions | ALL | parent `people.user_id = auth.uid()` |

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
| `009_person_activity_regions.sql` | `regions`, `person_activity_regions`, RLS |
| `010_regions_seed.sql` | nationwide sido + sigungu seed data |
| `011_experiences.sql` | `experiences` (space/journey), `floors.experience_id`, `sessions.experience_id`, Brickwell + coming soon seed |

---

## Not yet implemented (schema)

- `bookings` / payments
- Session waitlist
- Audit log table
- Street address + geocoding on activity regions (Phase B)
