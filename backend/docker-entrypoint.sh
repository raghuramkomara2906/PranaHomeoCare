#!/bin/sh
set -e

# When RUN_MIGRATIONS=true, apply migrations and seed before starting.
# (seed is idempotent — it only inserts if the clinic/admin rows are absent.)
if [ "${RUN_MIGRATIONS:-false}" = "true" ]; then
  echo "==> alembic upgrade head"
  alembic upgrade head
  echo "==> seeding baseline data"
  python -m app.seed || true
fi

exec "$@"