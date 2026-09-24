from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    PROJECT_NAME: str = "Livestock Health Surveillance System"
    API_V1_PREFIX: str = "/api/v1"
    SUPPORTED_LANGUAGES: list[str] = ["en", "hi", "mr"]

    DATABASE_URL: str = "postgresql+asyncpg://postgres:postgres@localhost:5432/livestock_surveillance"
    REDIS_URL: str = "redis://localhost:6379/0"

    SECRET_KEY: str = "your-secret-key-change-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30

    CELERY_BROKER_URL: str = "redis://localhost:6379/1"
    CELERY_RESULT_BACKEND: str = "redis://localhost:6379/2"

    WEATHER_API_KEY: str = ""
    AWS_S3_BUCKET: str = ""

    # Google OAuth (Sign in with Google). Client ID from the Google Cloud
    # console -> Credentials -> OAuth 2.0 Client IDs (type: Web).
    GOOGLE_CLIENT_ID: str = ""
    GOOGLE_CLIENT_SECRET: str = ""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
    )


@lru_cache()
def get_settings() -> Settings:
    return Settings()
