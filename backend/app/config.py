"""
Centralised settings, loaded from environment variables.
Never hardcode secrets (API keys, DB passwords) anywhere else in the codebase —
everything sensitive comes through here.
"""
from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import field_validator
from typing import List, Union


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

    # CORS — accepts EITHER a JSON array (e.g. ["https://a.com","https://b.com"])
    # OR a plain comma-separated string (e.g. https://a.com,https://b.com).
    # Railway/Vercel/Render variable input boxes frequently mangle JSON
    # syntax (stripped brackets/quotes), which previously crashed the app
    # on boot with a JSONDecodeError. Accepting the plain form removes that
    # entire failure mode — paste a bare URL and it just works.
    cors_origins: Union[str, List[str]] = "http://localhost:3000"

    @field_validator("cors_origins", mode="before")
    @classmethod
    def parse_cors_origins(cls, v):
        if isinstance(v, str):
            stripped = v.strip()
            if stripped.startswith("["):
                return v
            return [origin.strip() for origin in stripped.split(",") if origin.strip()]
        return v

    # Environment
    environment: str = "development"

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")


settings = Settings()
