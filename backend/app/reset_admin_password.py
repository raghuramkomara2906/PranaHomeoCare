"""One-off admin password reset.

Run locally with the target environment's DATABASE_URL, e.g. against production:

    DATABASE_URL='postgresql://user:pass@host:5432/dbname' \\
        python -m app.reset_admin_password doctor@pranahomeocare.com 'new-password'

Also clears any lockout state on that account. Does not touch Render's
SEED_ADMIN_PASSWORD env var — that only ever affects a brand-new admin row
(see app/seed.py), never an existing one.
"""

import sys

from app.core.security import hash_password
from app.database import SessionLocal
from app.models import AdminUser


def reset_admin_password(email: str, new_password: str) -> None:
    db = SessionLocal()
    try:
        admin = db.query(AdminUser).filter(AdminUser.email == email).first()
        if admin is None:
            print(f"No admin_users row found for {email}")
            sys.exit(1)
        admin.password_hash = hash_password(new_password)
        admin.failed_login_attempts = 0
        admin.locked_until = None
        db.commit()
        print(f"Password reset for {email}")
    finally:
        db.close()


if __name__ == "__main__":
    if len(sys.argv) != 3:
        print("Usage: python -m app.reset_admin_password <email> <new_password>")
        sys.exit(1)
    reset_admin_password(sys.argv[1], sys.argv[2])
