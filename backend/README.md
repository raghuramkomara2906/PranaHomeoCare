# Backend — FastAPI

Auth, roles, admin scheduling, and appointment persistence for the consultation platform. The frontend (`../src`) talks to this over `NEXT_PUBLIC_API_BASE_URL`.

## Setup

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env   # edit JWT_SECRET_KEY before anything real touches this
```

### Database

Local Postgres (already installed via Homebrew on this machine):

```bash
brew services start postgresql@16
createdb homeopath_dev
```

Or via Docker, if you'd rather not touch a local install — update `DATABASE_URL` in `.env` to `postgresql+psycopg://homeopath:homeopath@localhost:5432/homeopath_dev` first:

```bash
docker compose up -d
```

Then, either way:

```bash
alembic upgrade head
python -m app.seed   # creates the practitioner login + services + default hours
```

The seeded practitioner login is whatever `SEED_PRACTITIONER_EMAIL` / `SEED_PRACTITIONER_PASSWORD` are set to in `.env` (defaults: `practitioner@example.com` / `changeme123` — change these before anything real touches this).

## Run

```bash
uvicorn app.main:app --reload --port 8000
```

Interactive API docs at `http://localhost:8000/docs`.

## Test

```bash
createdb homeopath_test   # once
pytest
```

Tests run against `homeopath_test`, each wrapped in a transaction that's rolled back — they never touch `homeopath_dev`.

## Notes

- Single-practitioner system: `role` on `users` distinguishes `PATIENT` from `PRACTITIONER`, but there's no public registration endpoint — the only account is the seeded practitioner. Patients book as guest checkout (no account).
- Session is a JWT in an httpOnly cookie (`SameSite=Lax`), not a bearer token — the frontend's `apiFetch` sends `credentials: "include"`.
- Practice hours are a placeholder (`America/Phoenix`, chosen because it has no DST) — edit via `PUT /api/v1/admin/availability/rules` once logged in, or change the defaults in `app/seed.py`.
- Migrations: `alembic revision --autogenerate -m "..."` after changing a model, then `alembic upgrade head`.
