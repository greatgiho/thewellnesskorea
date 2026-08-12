#!/usr/bin/env bash
# Connection details for a target database, from its env file.
#
# Sourced, not run. Sets DB_URL, DB_REF and DB_LABEL for the target named in $1
# ("www" or "dev"). Both the apply script and the drift check need this, and a
# second hand-rolled copy is how the two would end up pointed at different
# databases while claiming to compare them.

resolve_db() {
  local target="${1:?usage: resolve_db <www|dev>}"

  case "$target" in
    www)
      # The env file locally, plain environment variables in CI. Sourcing only
      # when the file exists is what lets the same script run in both.
      if [ -f ".env.www" ]; then set -a; . "./.env.www"; set +a; fi
      : "${NEXT_PUBLIC_SUPABASE_URL:?set it, or provide .env.www}"
      : "${POSTGRES_PASSWORD:?set it, or provide .env.www}"
      DB_REF=$(printf '%s' "$NEXT_PUBLIC_SUPABASE_URL" | sed -E 's#https://([^.]+)\.supabase\.co#\1#')
      local enc
      enc=$(python3 -c "import urllib.parse,os;print(urllib.parse.quote(os.environ['POSTGRES_PASSWORD'],safe=''))")
      DB_URL="postgresql://postgres.${DB_REF}:${enc}@aws-1-ap-northeast-2.pooler.supabase.com:5432/postgres"
      DB_LABEL="PRODUCTION"
      ;;
    dev)
      if [ -f ".env.dev" ]; then set -a; . "./.env.dev"; set +a; fi
      : "${NEW_DB_POOLER_URL:?set it, or provide .env.dev}"
      # NEW_ prefix is a leftover from when this was the new project; only the
      # file was renamed, the keys were not.
      DB_URL="$NEW_DB_POOLER_URL"
      DB_REF=$(printf '%s' "${NEW_SUPABASE_PROJECT_REF:-dev}" )
      DB_LABEL="dev clone"
      ;;
    *)
      echo "unknown target: $target (expected www or dev)" >&2
      return 1
      ;;
  esac
}
