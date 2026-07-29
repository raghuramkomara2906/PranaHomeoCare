#!/bin/sh
set -e
cd /app
echo "==> DATABASE_URL starts with: $(echo $DATABASE_URL | cut -c1-30)..."
echo "==> Running migrations"
alembic upgrade head
echo "==> Seeding database"
python -m app.seed
echo "==> Pre-deploy complete"
