# The Wellness Korea — Database ERD

Last updated: 2026-06-16

Companion: [Schema reference](./database-schema.md) · [Backend logic](./backend-architecture.md)

---

## Entity relationship diagram

```mermaid
erDiagram
    AUTH_USERS ||--o| PEOPLE : "user_id (optional)"
    AUTH_USERS ||--o{ PEOPLE : "reviewed_by"
    PEOPLE ||--|{ PERSON_PROGRAMS : "has"
    PEOPLE ||--o{ SESSIONS : "instructs"
    FLOORS ||--|{ SESSIONS : "hosts"
    PERSON_PROGRAMS ||--o{ SESSIONS : "optional program"
    AUTH_USERS ||--o{ SESSIONS : "created_by"
    AUTH_USERS ||--o{ SESSIONS : "confirmed_by"
    AUTH_USERS ||--o{ SESSIONS : "cancelled_by"

    AUTH_USERS {
        uuid id PK
        text email
        jsonb app_metadata "role: teacher|admin"
    }

    PEOPLE {
        uuid id PK
        text slug UK
        person_kind kind
        text name_ko
        text name_en
        text email "UK lower when set"
        uuid user_id FK "UK when set"
        person_registration_status registration_status
        boolean is_published
        timestamptz submitted_at
        timestamptz reviewed_at
        uuid reviewed_by FK
    }

    PERSON_PROGRAMS {
        uuid id PK
        uuid person_id FK
        text title
        path_key_array path_keys
        int sort_order
    }

    FLOORS {
        uuid id PK
        text slug UK
        smallint level UK "1-4"
        text name_ko
        text name_en
    }

    SESSIONS {
        uuid id PK
        uuid floor_id FK
        uuid instructor_id FK
        uuid person_program_id FK "nullable"
        text title
        path_key_array path_keys
        timestamptz starts_at
        timestamptz ends_at
        int capacity
        int booked_count
        session_status status
        smallint slot_lane "0 or 1"
        boolean is_published
        text_array image_paths "max 3"
        jsonb description_blocks
        uuid created_by FK
        uuid confirmed_by FK
        uuid cancelled_by FK
    }
```

---

## Relationship summary

| From | To | Cardinality | ON DELETE | Notes |
|------|-----|-------------|-----------|-------|
| `people.user_id` | `auth.users` | 0..1 : 1 | SET NULL | One auth user → at most one person |
| `people.reviewed_by` | `auth.users` | N : 1 | — | Admin who approved/rejected |
| `person_programs.person_id` | `people` | N : 1 | CASCADE | Programs deleted with person |
| `sessions.instructor_id` | `people` | N : 1 | RESTRICT | Cannot delete person with sessions |
| `sessions.floor_id` | `floors` | N : 1 | RESTRICT | |
| `sessions.person_program_id` | `person_programs` | N : 0..1 | SET NULL | Optional link to specific program |
| `sessions.created_by` | `auth.users` | N : 1 | — | Admin who created |
| `sessions.confirmed_by` | `auth.users` | N : 1 | — | Admin who confirmed |
| `sessions.cancelled_by` | `auth.users` | N : 1 | — | Admin or system cancel |

---

## Domain groupings

```mermaid
flowchart TB
    subgraph auth [Supabase Auth]
        AU[auth.users]
    end

    subgraph people_domain [People domain]
        P[people]
        PP[person_programs]
        P --> PP
    end

    subgraph schedule_domain [Schedule domain]
        F[floors]
        S[sessions]
        F --> S
    end

    subgraph storage [Storage buckets]
        BP[person-photos]
        BS[session-photos]
    end

    AU -->|user_id| P
    P -->|instructor_id| S
    PP -.->|person_program_id| S
    P -.->|photo_path| BP
    S -.->|image_paths| BS
```

---

## Enum usage map

| Enum | Used in |
|------|---------|
| `person_kind` | `people.kind` |
| `path_key` | `person_programs.path_keys`, `sessions.path_keys` |
| `person_registration_status` | `people.registration_status` |
| `session_status` | `sessions.status` |

---

## Key business constraints (not FK)

| Constraint | Tables | Rule |
|------------|--------|------|
| Email uniqueness | `people` | `UNIQUE (lower(email))` where email not empty |
| Auth link uniqueness | `people` | `UNIQUE (user_id)` where not null |
| Session time | `sessions` | `ends_at > starts_at` |
| Session images | `sessions` | `cardinality(image_paths) <= 3` |
| Slot lane | `sessions` | `slot_lane BETWEEN 0 AND 1` |
| Floor level | `floors` | `level BETWEEN 1 AND 4` |
| Capacity | `sessions` | `capacity > 0`, `booked_count >= 0` |

---

## Public visibility (read path)

```mermaid
flowchart LR
    P[people] -->|is_published AND status in admin,approved| HP[Homepage guides/artists]
    PP[person_programs] -->|via published person| HP
    S[sessions] -->|is_published AND status confirmed| PS[Public schedule - not wired yet]
    F[floors] -->|always readable| PS
```

---

## Storage (logical, not relational FK)

| Entity | Column | Bucket |
|--------|--------|--------|
| Person | `photo_path` | `person-photos` |
| Session | `image_paths[]` | `session-photos` |

Paths are opaque strings; no DB FK to `storage.objects`.
