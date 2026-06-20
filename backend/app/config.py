"""
Centralised settings, loaded from environment variables.
Never hardcode secrets (API keys, DB passwords) anywhere else in the codebase —
everything sensitive comes through here.
"""
from pydantic_settings import BaseSettings
from typing import List


class Settings(BaseSettings):
    # Database
    database_url: str = "postgresql://sandbox:sandbox@localhost:5432/sandbox_ai"

    # Auth
    secret_key: str = "change-me-in-production"  # override via SECRET_KEY env var
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 60 * 24 * 7  # 7 days

    # Anthropic — the API key lives ONLY here, server-side. The frontend
    # never sees it. This is the fix for the old architecture's biggest
    # security problem (API key exposed in browser JS).
    anthropic_api_key: str = ""

    # CORS
    cors_origins: List[str] = ["http://localhost:3000"]

    # Environment
    environment: str = "development"

    class Config:
        env_file = ".env"


settings = Settings()
