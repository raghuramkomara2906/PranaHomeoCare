import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.core.security import hash_password
from app.database import Base, get_db
from app.main import app
from app.models.availability import WeeklyAvailabilityRule
from app.models.service import Service
from app.models.user import User, UserRole

TEST_DATABASE_URL = "postgresql+psycopg://komara@localhost:5432/homeopath_test"

engine = create_engine(TEST_DATABASE_URL, connect_args={"options": "-c timezone=UTC"})
TestSessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False)


@pytest.fixture(scope="session", autouse=True)
def _create_schema():
    Base.metadata.create_all(engine)
    yield
    Base.metadata.drop_all(engine)


@pytest.fixture
def db_session():
    connection = engine.connect()
    transaction = connection.begin()
    session = TestSessionLocal(bind=connection)
    yield session
    session.close()
    transaction.rollback()
    connection.close()


@pytest.fixture
def client(db_session):
    def override_get_db():
        yield db_session

    app.dependency_overrides[get_db] = override_get_db
    yield TestClient(app)
    app.dependency_overrides.clear()


@pytest.fixture
def practitioner(db_session):
    user = User(
        email="practitioner@example.com",
        password_hash=hash_password("changeme123"),
        full_name="Test Practitioner",
        role=UserRole.PRACTITIONER,
    )
    db_session.add(user)
    db_session.flush()

    for weekday in range(7):
        db_session.add(
            WeeklyAvailabilityRule(
                practitioner_id=user.id,
                weekday=weekday,
                start_minute=9 * 60,
                end_minute=17 * 60,
                is_active=weekday != 0,
            )
        )
    db_session.commit()
    return user


@pytest.fixture
def patient(db_session):
    user = User(
        email="patient@example.com",
        password_hash=hash_password("patientpass123"),
        full_name="Test Patient",
        role=UserRole.PATIENT,
    )
    db_session.add(user)
    db_session.commit()
    return user


@pytest.fixture
def service(db_session):
    svc = Service(
        id="svc_initial",
        slug="initial-consultation",
        name="Initial Online Consultation",
        short_description="Short description.",
        description="Long description.",
        duration_minutes=60,
        price=120,
        currency="USD",
        is_price_estimate=True,
        appropriate_for=["First-time patients"],
        included=["A 60-minute video consultation"],
    )
    db_session.add(svc)
    db_session.commit()
    return svc
