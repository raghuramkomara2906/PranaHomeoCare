#!/bin/sh
set -e
echo "==> Running migrations"
alembic upgrade head
echo "==> Seeding database"
python -m app.seed
echo "==> Pre-deploy complete"