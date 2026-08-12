#!/usr/bin/env bash
# Which migrations exist in the repo but not in a database's ledger.
#
#   bash scripts/check-migration-drift.sh www
#   bash scripts/check-migration-drift.sh dev
#
# Exits 1 when a database is behind, so it can gate something later.
#
# This exists because merging is automatic and applying is not. Code reaches
# production minutes after a merge; the schema it needs arrives only when
# someone remembers. On 2026-08-12 production spent hours serving code that
# queried tables it did not have, and nothing anywhere said so — the only way
# to find out was to paste two psql commands and compare the output by eye.
#
# Reads only. Safe to run against production.

set -euo pipefail

TARGET="${1:?usage: check-migration-drift.sh <www|dev>}"

# shellcheck source=scripts/lib/db-url.sh
. "$(dirname "$0")/lib/db-url.sh"
resolve_db "$TARGET"

# The ledger records the numeric prefix, so that is what the repo side has to
# be reduced to: 053_child_pricing.sql -> 053.
repo_versions=$(
  find supabase/migrations -name '[0-9]*.sql' -print0 \
    | xargs -0 -n1 basename \
    | sed -E 's/^([0-9]+)_.*/\1/' \
    | sort -u
)

db_versions=$(
  psql "$DB_URL" -tA -c \
    "select version from supabase_migrations.schema_migrations where version ~ '^[0-9]+$' order by version"
)

missing=$(comm -23 <(echo "$repo_versions") <(echo "$db_versions" | sort -u))
extra=$(comm -13 <(echo "$repo_versions") <(echo "$db_versions" | sort -u))

echo "=== $TARGET ($DB_LABEL) ==="
echo "repo: $(echo "$repo_versions" | wc -l | tr -d ' ') migrations"
echo "db:   $(echo "$db_versions" | grep -c . | tr -d ' ') recorded"
echo

if [ -n "$extra" ]; then
  # Not necessarily wrong — a number can be recorded by a migration that was
  # later renumbered — but it means the two sides disagree about history.
  echo "recorded but not in the repo:"
  echo "$extra" | sed 's/^/  /'
  echo
fi

if [ -z "$missing" ]; then
  echo "up to date."
  exit 0
fi

echo "MISSING from $TARGET — the database is behind the code:"
echo "$missing" | while read -r v; do
  file=$(find supabase/migrations -name "${v}_*.sql" | head -1)
  echo "  $v  ${file:-（파일 없음）}"
done
echo
if [ "$TARGET" = "www" ]; then
  echo "apply in order:  bash scripts/apply-prod-migration.sh <file>"
fi
exit 1
