"""Seed the single clinic_settings row, the doctor's admin login, and the
matching public doctor profile.

Idempotent: run it as many times as you like. Run with `python -m app.seed`.
"""

from app.config import settings
from app.core.security import hash_password
from app.database import SessionLocal
from app.models import AdminUser, ClinicSettings, DoctorProfile


def seed() -> None:
    db = SessionLocal()
    try:
        # 1. clinic_settings (one row)
        if db.query(ClinicSettings).first() is None:
            db.add(
                ClinicSettings(
                    clinic_name=settings.seed_clinic_name,
                    clinic_phone_e164=settings.seed_clinic_phone_e164,
                    timezone=settings.default_timezone,
                    slot_duration_minutes=settings.slot_duration_minutes,
                    cancellation_cutoff_minutes=settings.cancellation_cutoff_minutes,
                    video_join_early_minutes=settings.video_join_early_minutes,
                    tele_reminder_minutes=settings.tele_reminder_minutes,
                    current_terms_version=settings.seed_terms_version,
                )
            )
            print("seeded clinic_settings")

        # 2. admin_user (doctor login)
        admin = db.query(AdminUser).filter(AdminUser.email == settings.seed_admin_email).first()
        if admin is None:
            admin = AdminUser(
                email=settings.seed_admin_email,
                password_hash=hash_password(settings.seed_admin_password),
            )
            db.add(admin)
            db.flush()  # assign admin.id
            print(f"seeded admin_user {settings.seed_admin_email}")

        # 3. doctor_profile
        if db.query(DoctorProfile).filter(DoctorProfile.admin_user_id == admin.id).first() is None:
            db.add(
                DoctorProfile(
                    admin_user_id=admin.id,
                    display_name=settings.seed_doctor_display_name,
                    qualification=settings.seed_doctor_qualification,
                )
            )
            print("seeded doctor_profile")

        db.commit()
        print("seed complete")
    finally:
        db.close()


if __name__ == "__main__":
    seed()