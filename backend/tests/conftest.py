import os

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker

from app.core.security import hash_password
from app.database import Base, get_db
from app.main import app
from app.models import AdminUser, ClinicSettings, DoctorProfile


os.environ.setdefault("SMS_PROVIDER", "memory")

TEST_DATABASE_URL = os.environ.get(
    "TEST_DATABASE_URL",
    "postgresql+psycopg://postgres:postgres@localhost:5432/homeopath_test",
)

engine = create_engine(TEST_DATABASE_URL, connect_args={"options": "-c timezone=UTC"})
TestSessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False, future=True)


@pytest.fixture(scope="session", autouse=True)
def _create_schema():
    with engine.begin() as conn:
        conn.execute(text("CREATE EXTENSION IF NOT EXISTS citext"))
        conn.execute(text("CREATE EXTENSION IF NOT EXISTS btree_gist"))
    Base.metadata.create_all(engine)
    yield
    Base.metadata.drop_all(engine)


@pytest.fixture(autouse=True)
def _clean_tables():
    # The app commits real transactions, so isolate tests by truncating after each.
    yield
    tables = ", ".join(t.name for t in reversed(Base.metadata.sorted_tables))
    with engine.begin() as conn:
        conn.execute(text(f"TRUNCATE {tables} RESTART IDENTITY CASCADE"))


@pytest.fixture
def db_session():
    session = TestSessionLocal()
    try:
        yield session
    finally:
        session.close()


@pytest.fixture
def client():
    def override_get_db():
        db = TestSessionLocal()
        try:
            yield db
        finally:
            db.close()

    app.dependency_overrides[get_db] = override_get_db
    yield TestClient(app)
    app.dependency_overrides.clear()


@pytest.fixture
def seeded_admin(db_session):
    """clinic_settings + the doctor's admin login (password 'changeme123') +
    the matching doctor profile."""
    db_session.add(
        ClinicSettings(
            clinic_name="[Clinic Name]",
            clinic_phone_e164="+919876543210",
            current_terms_version="v1",
        )
    )
    admin = AdminUser(
        email="doctor@example.com", password_hash=hash_password("changeme123")
    )
    db_session.add(admin)
    db_session.flush()
    db_session.add(
        DoctorProfile(
            admin_user_id=admin.id,
            display_name="[Practitioner Name]",
            qualification="[Qualification]",
        )
    )
    db_session.commit()
    return admin