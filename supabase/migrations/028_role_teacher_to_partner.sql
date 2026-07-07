-- Unify the partner auth role label: "teacher" (legacy) -> "partner".
-- Backfills existing auth users. Idempotent. Must ship together with the code
-- that checks role === "partner" (provision, partner middleware, guards).
-- NOTE: session_posts.author_type "teacher" is a separate domain value and is
-- intentionally left unchanged here.

update auth.users
set raw_app_meta_data = jsonb_set(raw_app_meta_data, '{role}', '"partner"')
where raw_app_meta_data->>'role' = 'teacher';
