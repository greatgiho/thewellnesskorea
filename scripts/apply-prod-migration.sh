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
# The file runs inside a transaction, together with the ledger insert: any
# error rolls back both, and there is no state where the schema changed but
# the ledger does not know it. That state is what made 2026-08-12 hard to
# see — the ledger is the only record, so a missed insert makes every later
# comparison lie.
#
# Apply BEFORE merging, not after. Merging to dev fast-forwards main, which
# deploys, so a migration applied afterwards is applied to a production that
# has already been serving code that needs it. Migrations here are additive,
# so applying early is safe: the old code keeps working.

set -euo pipefail

FILE="${1:?usage: apply-prod-migration.sh <migration.sql>}"
[ -f "$FILE" ] || { echo "no such migration: $FILE" >&2; exit 1; }

# The ledger keys on the numeric prefix: 053_child_pricing.sql -> 053.
VERSION=$(basename "$FILE" | sed -E 's/^([0-9]+)_.*/\1/')
[ "$VERSION" != "$(basename "$FILE")" ] || {
  echo "cannot read a version from the filename: $FILE" >&2; exit 1; }

# shellcheck source=scripts/lib/db-url.sh
. "$(dirname "$0")/lib/db-url.sh"
resolve_db www
URL="$DB_URL"
REF="$DB_REF"

# Re-running a migration is not idempotent in general — it drops and recreates
# functions, moves data, renumbers indexes. If the ledger already has it, stop
# and make the human say so out loud.
ALREADY=$(psql "$URL" -tA -c \
  "select 1 from supabase_migrations.schema_migrations where version = '$VERSION'")
if [ -n "$ALREADY" ] && [ "${FORCE:-}" != "1" ]; then
  echo "$VERSION is already in the ledger. Re-run with FORCE=1 if you mean it." >&2
  exit 1
fi

echo "=== target: $REF (PRODUCTION) ==="
echo "=== migration: $FILE ==="
echo
echo "--- policy count before ---"
psql "$URL" -tA -c "select count(*) from pg_policies"

echo
echo "--- applying $VERSION (single transaction, ledger included) ---"
# The insert is appended to the file's own SQL rather than run afterwards, so
# that it shares the transaction. A second psql call would be a second
# transaction, which is exactly the gap this is meant to close.
{
  cat "$FILE"
  printf "\ninsert into supabase_migrations.schema_migrations (version) values ('%s') on conflict do nothing;\n" "$VERSION"
} | psql "$URL" -v ON_ERROR_STOP=1 --single-transaction -f -

echo
echo "--- policy count after ---"
psql "$URL" -tA -c "select count(*) from pg_policies"

echo
echo "--- ledger ---"
psql "$URL" -tA -c \
  "select string_agg(version, ' ' order by version) from supabase_migrations.schema_migrations where version ~ '^[0-9]+$'"

echo
echo "Done. $VERSION applied and recorded."
