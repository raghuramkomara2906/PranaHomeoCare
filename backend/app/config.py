from pydantic import computed_field, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Runtime configuration.

    Scheduling/business defaults (slot length, cutoffs, OTP policy) also live in
    the clinic_settings table; these values are the bootstrap used to seed that
    row and any place a request runs before settings are loaded. The table is
    authoritative at runtime — see app.models.clinic.ClinicSettings.
    """

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    # --- Database ---
    database_url: str = "postgresql+psycopg://komara@localhost:5432/homeopath_dev"

    # --- Doctor/admin session (JWT in an httpOnly cookie) ---
    jwt_secret_key: str = "change-me-in-production"
    jwt_algorithm: str = "HS256"
    jwt_expire_minutes: int = 60 * 8
    admin_session_cookie: str = "admin_session"
    patient_session_cookie: str = "patient_session"
    account_lockout_threshold: int = 5
    account_lockout_minutes: int = 15
    password_min_length: int = 8
    cookie_secure: bool = False

    # --- Secret hashing (OTP + access tokens are SHA-256 with this pepper) ---
    token_hash_pepper: str = "change-me-too"
    # Fernet key (base64, 32 bytes) for encrypting Zoom join URLs at rest.
    meeting_encryption_key: str = ""

    # --- Locale / market (India, V1) ---
    default_timezone: str = "Asia/Kolkata"
    default_country_code: str = "+91"

    # --- Scheduling defaults (seed clinic_settings) ---
    slot_duration_minutes: int = 30
    cancellation_cutoff_minutes: int = 1440  # 24h
    reschedule_cutoff_minutes: int = 180     # 3h
    video_join_early_minutes: int = 5
    video_join_grace_minutes: int = 15
    tele_reminder_minutes: int = 180

    # --- OTP policy ---
    otp_length: int = 6
    otp_ttl_seconds: int = 300
    otp_max_attempts: int = 5
    otp_resend_cooldown_seconds: int = 45
    otp_max_resends: int = 3
    booking_hold_ttl_seconds: int = 300

    # --- SMS provider ---
    sms_provider: str = "console"
    sms_api_key: str = ""
    sms_sender_id: str = ""
    fast2sms_route: str = "q"
    otp_provider: str = ""
    twofactor_api_key: str = ""
    twofactor_otp_template: str = ""

    # --- CORS ---
    cors_origins: str = "http://localhost:3000,http://localhost:3001"

    # --- Bootstrap seed ---
    seed_admin_email: str = "doctor@example.com"
    seed_admin_password: str = "changeme123"
    seed_clinic_name: str = "Prana Homeo Care"
    seed_clinic_phone_e164: str = "+91 7981946152"
    seed_doctor_display_name: str = "Yamini Vedurparthi"
    seed_doctor_qualification: str = "BHMS (Bachelor of Homeopathic Medicine & Surgery)"
    seed_terms_version: str = "v1"

    @field_validator("database_url")
    @classmethod
    def _normalize_db_scheme(cls, v: str) -> str:
        if v.startswith("postgresql://"):
            return "postgresql+psycopg://" + v[len("postgresql://"):]
        return v

    @computed_field
    @property
    def cors_origin_list(self) -> list[str]:
        return [o.strip() for o in self.cors_origins.split(",") if o.strip()]


settings = Settings()