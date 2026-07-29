#!/bin/sh
set -e
cd /app

# Render provides postgresql:// but SQLAlchemy+psycopg3 needs postgresql+psycopg://
if echo "$DATABASE_URL" | grep -q "^postgresql://"; then
    export DATABASE_URL="postgresql+psycopg://$(echo $DATABASE_URL | sed 's|^postgresql://||')"
fi

echo "==> DATABASE_URL scheme: $(echo $DATABASE_URL | cut -d: -f1)"
echo "==> Running migrations"
alembic upgrade head
echo "==> Seeding database"
python -m app.seed
echo "==> Pre-deploy complete"
