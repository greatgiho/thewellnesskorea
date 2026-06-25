# The Wellness Korea — Database ERD

Last updated: 2026-06-26

Companion: [Schema reference](./database-schema.md) · [Backend logic](./backend-architecture.md) · [Site map](./site-map-and-flows.md) · [Multi-experience requirements](./multi-venue-requirements.md) · [Audit log](./architecture-audit-log.md)

> 목적: 데이터 간 관계 시각화

---

## Entity relationship diagram

```mermaid
erDiagram
    AUTH_USERS ||--o| PARTNERS : "owns via user_id"
    AUTH_USERS ||--o{ PARTNERS : "reviews via reviewed_by"
    AUTH_USERS ||--o| MEMBERS : "participant profile"
    AUTH_USERS ||--o{ SESSIONS : "created_by"
    AUTH_USERS ||--o{ SESSIONS : "confirmed_by"
    AUTH_USERS ||--o{ SESSIONS : "cancelled_by"
    AUTH_USERS ||--o{ BOOKINGS : "member booking"
    AUTH_USERS ||--o{ WAITLIST_ENTRIES : "member waitlist"

    PARTNERS ||--|{ PARTNER_PROGRAMS : "has"
    PARTNERS ||--o{ PARTNER_ACTIVITY_REGIONS : "activity"
    PARTNERS ||--o{ SESSIONS : "instructs"
    PARTNERS ||--o{ JOURNAL_POST_PARTNERS : "tagged partner"

    REGIONS ||--o{ REGIONS : "parent"
    REGIONS ||--o{ PARTNER_ACTIVITY_REGIONS : "codes"

    EXPERIENCES ||--|{ FLOORS : "has"
    EXPERIENCES ||--o{ SESSIONS : "hosts"
    EXPERIENCES ||--o{ JOURNAL_POSTS : "optional tag"

    FLOORS ||--|{ SESSIONS : "level"
    PARTNER_PROGRAMS ||--o{ SESSIONS : "linked_program"
    SESSIONS ||--o{ BOOKINGS : "reservations"
    SESSIONS ||--o{ WAITLIST_ENTRIES : "waitlist"
    BOOKINGS ||--o{ PAYMENTS : "pg attempts"

    JOURNAL_POSTS ||--|{ JOURNAL_POST_PARTNERS : "partner tags"

    AUTH_USERS {
        uuid id PK
        text email
        jsonb app_metadata
    }

    MEMBERS {
        uuid id PK_FK
        text name
        text phone
        text locale
    }

    PARTNERS {
        uuid id PK
        text slug UK
        partner_kind kind
        text name_ko
        text name_en
        text email
        uuid user_id FK
        partner_registration_status registration_status
        boolean is_published
        text photo_path
        timestamptz submitted_at
        timestamptz reviewed_at
        uuid reviewed_by FK
    }

    PARTNER_PROGRAMS {
        uuid id PK
        uuid partner_id FK
        text title
        text description
        int sort_order
    }

    REGIONS {
        text code PK
        text parent_code FK
        smallint level
        text name_ko
        text name_en
    }

    PARTNER_ACTIVITY_REGIONS {
        uuid partner_id FK
        smallint priority
        text region_code FK
    }

    EXPERIENCES {
        uuid id PK
        text slug UK
        experience_kind kind
        text name_en
        boolean is_published
        boolean schedule_enabled
        int sort_order
    }

    FLOORS {
        uuid id PK
        uuid experience_id FK
        text slug
        smallint level
        text name_ko
        text name_en
    }

    SESSIONS {
        uuid id PK
        uuid experience_id FK
        uuid floor_id FK
        uuid instructor_id FK
        uuid partner_program_id FK
        text title
        timestamptz starts_at
        timestamptz ends_at
        int capacity
        int booked_count
        int price_krw
        session_status status
        smallint slot_lane
        boolean is_published
        jsonb description_blocks
        uuid created_by FK
        text created_by_email
        uuid confirmed_by FK
        uuid cancelled_by FK
    }

    BOOKINGS {
        uuid id PK
        uuid session_id FK
        uuid user_id FK
        text guest_name
        text guest_email
        text guest_phone
        booking_status status
        text cancel_token UK
        timestamptz expires_at
        timestamptz cancelled_at
    }

    PAYMENTS {
        uuid id PK
        uuid booking_id FK
        text merchant_uid UK
        text pg_provider
        int amount
        payment_status status
        text pg_tid UK
        timestamptz paid_at
    }

    WAITLIST_ENTRIES {
        uuid id PK
        uuid session_id FK
        uuid user_id FK
        text guest_name
        text guest_email
        text guest_phone
        timestamptz notified_at
        timestamptz created_at
    }

    JOURNAL_POSTS {
        uuid id PK
        text slug UK
        text title_en
        text excerpt_en
        text body_en
        text hero_image_path
        text focal_point
        journal_category category
        timestamptz published_at
        int read_minutes
        boolean is_published
        uuid experience_id FK
    }

    JOURNAL_POST_PARTNERS {
        uuid id PK
        uuid journal_post_id FK
        uuid partner_id FK
        int sort_order
    }
```

> `path_keys` (enum array) on `PARTNER_PROGRAMS` and `SESSIONS` omitted from diagram for readability. `sessions.instructor_id` FK column name unchanged (points to `partners`). `body_en` stores sanitized TipTap HTML. See [database-schema.md](./database-schema.md).

---

## Relationship table

| From | To | Cardinality | ON DELETE | Notes |
|------|-----|-------------|-----------|-------|
| `partners.user_id` | `auth.users` | 0..1 : 1 | SET NULL | At most one partner profile per auth user |
| `partners.reviewed_by` | `auth.users` | N : 1 | — | Reviewing admin |
| `members.id` | `auth.users` | 1 : 1 | CASCADE | Participant profile (role `member`) |
| `partner_programs.partner_id` | `partners` | N : 1 | CASCADE | |
| `partner_activity_regions.partner_id` | `partners` | N : 1 | CASCADE | priority 1 or 2 per partner |
| `partner_activity_regions.region_code` | `regions` | N : 1 | RESTRICT | sigungu-level code |
| `regions.parent_code` | `regions` | N : 0..1 | RESTRICT | sido → null parent |
| `experiences` | Space / Journey master; hero + schedule branch |
| `floors.experience_id` | `experiences` | N : 1 | RESTRICT | Unique (experience_id, slug/level) |
| `sessions.experience_id` | `experiences` | N : 1 | RESTRICT | Must match floor's experience (trigger) |
| `sessions.instructor_id` | `partners` | N : 1 | RESTRICT | Blocks partner delete; column name unchanged |
| `sessions.floor_id` | `floors` | N : 1 | RESTRICT | |
| `sessions.partner_program_id` | `partner_programs` | N : 0..1 | SET NULL | Optional |
| `sessions.created_by` | `auth.users` | N : 1 | — | |
| `sessions.confirmed_by` | `auth.users` | N : 1 | — | |
| `sessions.cancelled_by` | `auth.users` | N : 1 | — | |
| `bookings.session_id` | `sessions` | N : 1 | RESTRICT | |
| `bookings.user_id` | `auth.users` | N : 0..1 | SET NULL | NULL = guest booking |
| `payments.booking_id` | `bookings` | N : 1 | CASCADE | PG payment attempts |
| `waitlist_entries.session_id` | `sessions` | N : 1 | CASCADE | Spot-available notify on cancel |
| `waitlist_entries.user_id` | `auth.users` | N : 0..1 | SET NULL | Member waitlist link |
| `journal_posts.experience_id` | `experiences` | N : 0..1 | SET NULL | Optional Space/Journey tag |
| `journal_post_partners.journal_post_id` | `journal_posts` | N : 1 | CASCADE | Partner footer tags |
| `journal_post_partners.partner_id` | `partners` | N : 1 | CASCADE | Guide / Artist / Brand profile link |

---

## Domain groupings

```mermaid
flowchart TB
    subgraph auth_domain [Auth]
        AU[auth.users]
        M[members]
        AU --> M
    end

    subgraph partners_domain [Partners]
        P[partners]
        PP[partner_programs]
        PAR[partner_activity_regions]
        P --> PP
        P --> PAR
    end

    subgraph geo_domain [Regions]
        R[regions]
        R --> R
        PAR --> R
    end

    subgraph schedule_domain [Schedule]
        E[experiences]
        F[floors]
        S[sessions]
        E --> F
        F --> S
        E --> S
    end

    subgraph booking_domain [Bookings]
        B[bookings]
        S --> B
        AU --> B
    end

    subgraph journal_domain [Journal]
        JP[journal_posts]
        JPP[journal_post_partners]
        JP --> JPP
        JPP --> P
        E -.-> JP
    end

    subgraph storage_domain [Storage]
        BP[person-photos]
        BS[session-photos]
        BJ[journal-photos]
    end

    AU -->|user_id| P
    AU -->|reviewed_by| P
    P -->|instructor_id| S
    PP -.->|partner_program_id| S
    P -.->|photo_path| BP
    S -.->|image_paths| BS
    JP -.->|hero_image_path body images| BJ
```

| Domain | Tables | Storage |
|--------|--------|---------|
| Partners | `partners`, `partner_programs`, `partner_activity_regions` | `person-photos` |
| Schedule | `experiences`, `floors`, `sessions` | `session-photos` |
| Bookings | `members`, `bookings`, `payments` | — |
| Journal | `journal_posts`, `journal_post_partners` | `journal-photos` |
| Auth | `auth.users` (managed), `members` | — |

---

## Enum usage

| Enum | Columns |
|------|---------|
| `partner_kind` | `partners.kind` — `guide`, `artist`, `both`, `brand` |
| `path_key` | `partner_programs.path_keys[]`, `sessions.path_keys[]` |
| `partner_registration_status` | `partners.registration_status` |
| `session_status` | `sessions.status` |
| `experience_kind` | `experiences.kind` — `space`, `journey` |
| `booking_status` | `bookings.status` |
| `payment_status` | `payments.status` |
| `journal_category` | `journal_posts.category` |

---

## Constraints (non-FK)

| Rule | Target |
|------|--------|
| `UNIQUE (lower(email))` where set | `partners` |
| `UNIQUE (user_id)` where set | `partners` |
| `ends_at > starts_at` | `sessions` |
| `cardinality(image_paths) <= 3` | `sessions` |
| `slot_lane BETWEEN 0 AND 1` | `sessions` |
| `level BETWEEN 1 AND 99` | `floors` |
| `capacity > 0`, `booked_count >= 0` | `sessions` |
| `session.experience_id = floor.experience_id` | `sessions` (trigger `sessions_floor_experience_match`) |
| Unique active booking per session + email/user | `bookings` (partial indexes) |
| Unique active waitlist per session + email/user | `waitlist_entries` (partial indexes) |
| `UNIQUE (journal_post_id, partner_id)` | `journal_post_partners` |

---

## Public read paths

Anonymous (`anon`) and authenticated users can **SELECT** only through RLS policies below. Writes require admin session (or teacher own-row policies).

```mermaid
flowchart TD
    subgraph public_read [Public SELECT allowed]
        P[partners]
        PP[partner_programs]
        PAR[partner_activity_regions]
        R[regions]
        E[experiences]
        F[floors]
        S[sessions]
        JP[journal_posts]
        JPP[journal_post_partners]
    end

    P -->|published plus approved or admin| HP[Homepage Partners / Guides / Artists]
    PP -->|via published partner| HP
    PAR -->|via published partner| HP
    R -->|always| GEO[Region pickers]
    E -->|is_published| EXP[Experience pages]
    F -->|always| PS[Schedule UI]
    S -->|published and confirmed| PS
    S -->|own instructor plus RLS| TP[Teacher portal /teacher]
    JP -->|is_published| JU[Journal list and detail]
    JPP -->|published post plus partner| JU
```

| Entity | Public read condition | Wired to UI |
|--------|----------------------|-------------|
| `partners` | published + `admin`\|`approved` | ✓ homepage, `/partners/[slug]` |
| `partner_programs` | via published partner | ✓ homepage cards |
| `partner_activity_regions` | via published partner | ✓ profile region display |
| `regions` | always | ✓ admin / apply region pickers |
| `experiences` | `is_published = true` | ✓ experience landing |
| `floors` | always | ✓ schedule (partial) |
| `sessions` | published + `confirmed` | ✓ teacher portal; homepage schedule |
| `journal_posts` | `is_published = true` | ✓ `/journal`, `/journal/[slug]` |
| `journal_post_partners` | published post + published partner | ✓ journal footer partner cards |
| `members` | own row only (`id = auth.uid()`) | ✓ `/account/*` |
| `bookings` | own row only (`user_id = auth.uid()`) | ✓ `/account/bookings` |
| `waitlist_entries` | own row only (`user_id = auth.uid()`) | — (join via RPC; no direct UI list) |
| Storage objects | bucket public flag | ✓ photo URLs |

**Teacher read:** own `partners` + `partner_programs` + `partner_activity_regions` via `user_id = auth.uid()`; own `sessions` where confirmed + published (`/teacher` dashboard).

**Admin read/write:** all app tables via `is_admin_user()` (`app_metadata.role = 'admin'`). Floors writes are admin-only (migration `018`).

**Guest booking:** insert via `create_booking` / `create_booking_hold` RPC. **Waitlist:** insert via `join_waitlist` RPC — no direct anon INSERT on `waitlist_entries`.

---

## Storage (logical links)

| DB column | Bucket | Cardinality |
|-----------|--------|-------------|
| `partners.photo_path` | `person-photos` | 0..1 |
| `sessions.image_paths` | `session-photos` | 0..3 |
| `journal_posts.hero_image_path` | `journal-photos` | 0..1 |
| inline body images | `journal-photos` | 0..N (`{postId}/inline/*`) |

No relational FK to `storage.objects`.
