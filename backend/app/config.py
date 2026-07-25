from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    database_url: str = "postgresql+psycopg://komara@localhost:5432/homeopath_dev"

    jwt_secret_key: str = "change-me-in-production"
    jwt_algorithm: str = "HS256"
    jwt_expire_minutes: int = 60 * 24

    cors_origins: str = "http://localhost:3000,http://localhost:3001,http://localhost:3002"
    cookie_secure: bool = False

    seed_practitioner_email: str = "practitioner@example.com"
    seed_practitioner_password: str = "changeme123"
    seed_practitioner_name: str = "[Practitioner Name]"

    @property
    def cors_origin_list(self) -> list[str]:
        return [origin.strip() for origin in self.cors_origins.split(",") if origin.strip()]


settings = Settings()
