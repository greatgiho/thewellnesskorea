#!/usr/bin/env bash
# Apply one migration file to the production Supabase database.
#
# Prod has no CLI access token, so migrations go through the session pooler
# with the password from .env.www. This wraps that so there is a single
# reviewed entry point rather than an ad-hoc psql line each time, and so the
# before/after state gets printed for the hand-kept ledger.
#
#   bash scripts/apply-prod-migration.sh supabase/migrations/035_viewer_role.sql
#
# The file runs inside a transaction: any error rolls the whole thing back.

set -euo pipefail

FILE="${1:?usage: apply-prod-migration.sh <migration.sql>}"
[ -f "$FILE" ] || { echo "no such migration: $FILE" >&2; exit 1; }

ENV_FILE=".env.www"
[ -f "$ENV_FILE" ] || { echo "missing $ENV_FILE" >&2; exit 1; }

set -a; . "./$ENV_FILE"; set +a

REF=$(printf '%s' "$NEXT_PUBLIC_SUPABASE_URL" | sed -E 's#https://([^.]+)\.supabase\.co#\1#')
ENC=$(python3 -c "import urllib.parse,os;print(urllib.parse.quote(os.environ['POSTGRES_PASSWORD'],safe=''))")
URL="postgresql://postgres.${REF}:${ENC}@aws-1-ap-northeast-2.pooler.supabase.com:5432/postgres"

echo "=== target: $REF (PRODUCTION) ==="
echo "=== migration: $FILE ==="
echo
echo "--- policy count before ---"
psql "$URL" -tA -c "select count(*) from pg_policies"

echo
echo "--- applying (single transaction) ---"
psql "$URL" -v ON_ERROR_STOP=1 --single-transaction -f "$FILE"

echo
echo "--- policy count after ---"
psql "$URL" -tA -c "select count(*) from pg_policies"

echo
echo "Done. Record this in the migration ledger."
