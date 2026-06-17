# The Wellness Korea — Database Schema

Last updated: 2026-06-16

Source of truth: `supabase/migrations/001`–`007`. Companion: [ERD](./database-erd.md) · [Backend logic](./backend-architecture.md)

Apply order: `001` → `002` → `003` → `004` → `005` → `007` (use `007` instead of `006` if email dedupe is needed; `007` is idempotent).

---

## Enums

### `person_kind`

| Value | Meaning |
|-------|---------|
| `guide` | Guide only |
| `artist` | Artist only |
| `both` | Guide and artist |

### `path_key` (K-wellness philosophy paths)

`bium` · `kkaeum` · `jieum` · `chaeum` · `nurim`

### `session_status`

| Value | Meaning |
|-------|---------|
| `processing` | Competing draft slot (max 2 per floor+time) |
| `confirmed` | Finalized slot |
| `cancelled` | Soft-deleted / auto-cancelled |

### `person_registration_status`

| Value | Meaning |
|-------|---------|
| `admin` | Created by admin |
| `draft` | Teacher writing |
| `submitted` | Awaiting admin review |
| `approved` | Admin approved |
| `rejected` | Admin rejected |

---

## Tables

### `people`

Guide/Artist master profile.

| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid PK | `gen_random_uuid()` |
| `slug` | text UNIQUE | URL-safe identifier |
| `kind` | person_kind | |
| `name_ko`, `name_en` | text | |
| `role_ko`, `role_en` | text | |
| `quote` | text nullable | |
| `modalities` | text[] | Legacy; migrated to programs in 002 |
| `phone`, `email`, `instagram` | text nullable | 002; email unique (lower) when set |
| `photo_path` | text nullable | `person-photos` bucket path |
| `sort_order` | int | default 0 |
| `is_published` | boolean | default false |
| `user_id` | uuid FK → auth.users | nullable; unique when set (006/007) |
| `registration_status` | person_registration_status | default `admin` |
| `submitted_at` | timestamptz nullable | |
| `reviewed_at` | timestamptz nullable | |
| `reviewed_by` | uuid FK → auth.users | |
| `rejection_reason` | text nullable | |
| `created_at`, `updated_at` | timestamptz | `set_updated_at` trigger |

**Indexes:** `(kind, is_published, sort_order)`, `(registration_status, updated_at desc)`, unique `(user_id) WHERE user_id IS NOT NULL`, unique `(lower(email)) WHERE email IS NOT NULL AND trim <> ''`

### `person_programs`

Programs offered by a person.

| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid PK | |
| `person_id` | uuid FK → people | ON DELETE CASCADE |
| `title` | text | |
| `description` | text nullable | |
| `path_keys` | path_key[] | default `{}` |
| `sort_order` | int | default 0 |
| `created_at` | timestamptz | |

**Index:** `(person_id, sort_order)`

### `floors`

Brickwell building floors (seeded 1F–4F).

| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid PK | |
| `slug` | text UNIQUE | `1f`…`4f` |
| `level` | smallint UNIQUE | 1–4 |
| `name_ko`, `name_en` | text | |
| `sort_order` | int | |

### `sessions`

Scheduled class sessions.

| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid PK | |
| `floor_id` | uuid FK → floors | ON DELETE RESTRICT |
| `instructor_id` | uuid FK → people | ON DELETE RESTRICT |
| `person_program_id` | uuid FK → person_programs | nullable, SET NULL |
| `title` | text | |
| `path_keys` | path_key[] | |
| `starts_at`, `ends_at` | timestamptz | CHECK ends > starts |
| `capacity` | int | > 0 |
| `booked_count` | int | ≥ 0, default 0 |
| `is_published` | boolean | default false |
| `status` | session_status | default `processing` (005) |
| `slot_lane` | smallint | 0 or 1 (005) |
| `confirmed_at` | timestamptz nullable | |
| `confirmed_by` | uuid FK → auth.users | |
| `created_by` | uuid FK → auth.users | |
| `created_by_email` | text nullable | |
| `cancelled_at` | timestamptz nullable | |
| `cancelled_by` | uuid FK → auth.users | |
| `cancel_reason` | text nullable | |
| `image_paths` | text[] | max 3 (004) |
| `description_blocks` | jsonb | `{ intro, progress, preparation }` |
| `created_at`, `updated_at` | timestamptz | trigger on update |

**Indexes:** `(floor_id, starts_at)`, `(instructor_id, starts_at)`, `(starts_at)`, `(status, starts_at)`

---

## Functions

### `set_updated_at()`

Trigger function: sets `updated_at = now()` on `people`, `sessions`.

### `is_admin_user()`

```sql
(auth.jwt() -> 'app_metadata' ->> 'role') IS DISTINCT FROM 'teacher'
```

Used in RLS policies. `NULL` role counts as admin.

---

## Row Level Security

### `people`

| Policy | Role | Operation | Rule |
|--------|------|-----------|------|
| public read published people | anon, authenticated | SELECT | `is_published AND registration_status IN ('admin','approved')` |
| admin all on people | authenticated | ALL | `is_admin_user()` |
| teacher read own people | authenticated | SELECT | `user_id = auth.uid()` |
| teacher insert own people | authenticated | INSERT | `user_id = auth.uid()`, status draft/submitted, not published, no existing row for user |
| teacher update own people | authenticated | UPDATE | `user_id = auth.uid()`, `is_published = false` |

### `person_programs`

| Policy | Operation | Rule |
|--------|-----------|------|
| public read programs of published people | SELECT | parent person published + approved/admin |
| admin all on person_programs | ALL | `is_admin_user()` |
| teacher manage own programs | ALL | parent `people.user_id = auth.uid()` |

### `floors`

| Policy | Operation | Rule |
|--------|-----------|------|
| public read floors | SELECT | always |
| admin all on floors | ALL | authenticated (legacy; admin app only) |

### `sessions`

| Policy | Operation | Rule |
|--------|-----------|------|
| public read published sessions | SELECT | `is_published AND status = 'confirmed'` |
| admin all on sessions | ALL | authenticated |

---

## Storage

### Buckets

| ID | Public | Limit | Types |
|----|--------|-------|-------|
| `person-photos` | yes | 5 MB | jpeg, png, webp |
| `session-photos` | yes | 5 MB | jpeg, png, webp |

Policies: public SELECT; authenticated INSERT/UPDATE/DELETE per bucket.

---

## Auth.users (Supabase managed)

Not in app migrations but referenced by FK:

- `people.user_id`, `reviewed_by`
- `sessions.confirmed_by`, `created_by`, `cancelled_by`

`app_metadata.role`: `teacher` | `admin` | unset (admin). Set via service client on teacher onboarding.

---

## Migration history

| File | Summary |
|------|---------|
| `001_people.sql` | `people` table, `person_kind`, RLS, `person-photos` bucket |
| `002_person_programs.sql` | contact fields, `path_key`, `person_programs`, modality migration |
| `003_schedule.sql` | `floors` seed, `sessions` table |
| `004_session_content.sql` | session images + description JSON, `session-photos` bucket |
| `005_session_status.sql` | `session_status`, slot workflow, public read policy update |
| `006_teacher_self_registration.sql` | registration workflow + teacher RLS (may fail on dup email) |
| `007_fix_duplicate_emails.sql` | idempotent full 006 + email dedupe before unique index |

---

## Not yet implemented (schema)

- `bookings` / payment tables
- Session waitlist
- Audit log table
