from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    DATABASE_URL: str = "sqlite:///./sakhi.db"
    REDIS_URL: str = "redis://localhost:6379/0"
    SECRET_KEY: str = "sih2024-secret-change-later"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7


settings = Settings()
