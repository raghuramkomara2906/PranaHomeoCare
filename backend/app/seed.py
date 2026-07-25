"""Seeds the practitioner/admin account, the 4 consultation services (mirrors
src/data/services.ts), and default Mon-Sat 9am-5pm weekly availability.

Run with: python -m app.seed
"""

from app.config import settings
from app.core.security import hash_password
from app.database import SessionLocal
from app.models.availability import WeeklyAvailabilityRule
from app.models.service import Service
from app.models.user import User, UserRole

SERVICES = [
    {
        "id": "svc_initial",
        "slug": "initial-consultation",
        "name": "Initial Online Consultation",
        "short_description": "A comprehensive first meeting to get to know you and explain how ongoing consultations work.",
        "description": "Your first appointment is a relaxed, thorough conversation over video call. It gives the practitioner a full picture of your goals and gives you a clear sense of what to expect from consultations going forward — no forms to fill in beforehand beyond your booking details.",
        "duration_minutes": 60,
        "price": 120,
        "appropriate_for": [
            "First-time patients",
            "Anyone new to online consultations",
            "People who'd like to understand the process before committing further",
        ],
        "included": [
            "A 60-minute video consultation",
            "Time to ask questions about the process",
            "A clear summary of recommended next steps",
        ],
    },
    {
        "id": "svc_followup",
        "slug": "follow-up-consultation",
        "name": "Follow-up Consultation",
        "short_description": "A shorter check-in to discuss how things have been going since your last visit.",
        "description": "Follow-up consultations keep the conversation going for existing patients. They're shorter than an initial consultation and focused on continuity — what's changed, what questions have come up, and what happens next.",
        "duration_minutes": 30,
        "price": 65,
        "appropriate_for": [
            "Existing patients with a prior consultation on file",
            "Anyone continuing a regular series of visits",
        ],
        "included": [
            "A 30-minute video consultation",
            "A chance to ask follow-up questions",
            "Help scheduling your next visit, if needed",
        ],
    },
    {
        "id": "svc_wellness",
        "slug": "general-wellness-consultation",
        "name": "General Wellness Consultation",
        "short_description": "For anyone who'd like an open conversation about overall wellbeing.",
        "description": "This consultation is designed for people who don't yet have a specific reason to book, but want to start a conversation about their general wellbeing with a qualified practitioner in a calm, unhurried setting.",
        "duration_minutes": 45,
        "price": 90,
        "appropriate_for": [
            "Anyone curious about general wellbeing conversations",
            "People who are not currently an existing patient",
        ],
        "included": [
            "A 45-minute video consultation",
            "An open, unhurried conversation",
            "Guidance on whether further visits may be useful",
        ],
    },
    {
        "id": "svc_family",
        "slug": "family-consultation",
        "name": "Family Consultation",
        "short_description": "A single extended session for multiple family or household members together.",
        "description": "Family consultations give households a shared block of time to speak with the practitioner together. It's a practical option when several family members would each like some time on the same call.",
        "duration_minutes": 75,
        "price": 150,
        "appropriate_for": [
            "Households or families attending together",
            "Multiple family members with overlapping availability",
        ],
        "included": [
            "A 75-minute video consultation for multiple attendees",
            "Shared and individual discussion time",
            "Guidance on booking any individual follow-ups",
        ],
    },
]

# Weekday 0=Sunday..6=Saturday. Closed Sunday, 9am-5pm every other day.
DEFAULT_WEEKLY_HOURS = [
    {"weekday": weekday, "start_minute": 9 * 60, "end_minute": 17 * 60, "is_active": weekday != 0}
    for weekday in range(7)
]


def seed() -> None:
    db = SessionLocal()
    try:
        practitioner = db.query(User).filter(User.role == UserRole.PRACTITIONER).first()
        if practitioner is None:
            practitioner = User(
                email=settings.seed_practitioner_email,
                password_hash=hash_password(settings.seed_practitioner_password),
                full_name=settings.seed_practitioner_name,
                role=UserRole.PRACTITIONER,
            )
            db.add(practitioner)
            db.flush()
            print(f"Created practitioner account: {practitioner.email}")
        else:
            print(f"Practitioner account already exists: {practitioner.email}")

        for service_data in SERVICES:
            existing = db.get(Service, service_data["id"])
            if existing is None:
                db.add(Service(currency="USD", is_price_estimate=True, **service_data))
        print(f"Ensured {len(SERVICES)} services exist.")

        existing_weekdays = {
            rule.weekday
            for rule in db.query(WeeklyAvailabilityRule)
            .filter(WeeklyAvailabilityRule.practitioner_id == practitioner.id)
            .all()
        }
        for rule_data in DEFAULT_WEEKLY_HOURS:
            if rule_data["weekday"] not in existing_weekdays:
                db.add(WeeklyAvailabilityRule(practitioner_id=practitioner.id, **rule_data))
        print("Ensured default weekly availability rules exist.")

        db.commit()
        print("Seed complete.")
    finally:
        db.close()


if __name__ == "__main__":
    seed()
