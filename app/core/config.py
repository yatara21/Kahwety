from pydantic import Field, model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import Optional


class Settings(BaseSettings):
    app_name: str = "Cafe Platform"
    environment: str = "development"
    debug: bool = False

    database_url: str
    database_pool_size: int = Field(default=5, ge=1)
    database_max_overflow: int = Field(default=5, ge=0)
    database_pool_timeout_seconds: int = Field(default=30, ge=1)
    secret_key: str
    jwt_algorithm: str = "HS256"
    access_token_expire_minutes: int = 15
    refresh_token_expire_days: int = 7

    cors_origins: str = "http://localhost:3000,http://localhost:8000"
    log_level: str = "INFO"

    google_client_id: Optional[str] = None
    google_client_secret: Optional[str] = None

    twilio_sid: Optional[str] = None
    twilio_auth_token: Optional[str] = None
    twilio_verify_sid: Optional[str] = None
    twilio_phone_number: Optional[str] = None

    moyasar_publishable_key: Optional[str] = None
    moyasar_secret_key: Optional[str] = None
    moyasar_webhook_secret: Optional[str] = None
    moyasar_base_url: str = "https://api.moyasar.com/v1"
    moyasar_callback_url: Optional[str] = None
    moyasar_success_url: Optional[str] = None
    moyasar_back_url: Optional[str] = None

    auth_login_rate_limit: int = Field(default=10, ge=1)
    auth_otp_rate_limit: int = Field(default=5, ge=1)
    auth_rate_limit_window_seconds: int = Field(default=60, ge=1)

    model_config = SettingsConfigDict(env_file=".env", case_sensitive=False, extra="ignore")

    @model_validator(mode="after")
    def validate_production_security(self):
        if self.environment.lower() == "production":
            if self.debug:
                raise ValueError("DEBUG must be false in production")
            weak_secret_values = {"change-me-in-production", "secret", "default", "changeme"}
            normalized_secret = self.secret_key.lower()
            if (
                len(self.secret_key) < 32
                or normalized_secret in weak_secret_values
                or any(marker in normalized_secret for marker in ("generate", "replace", "change_me"))
            ):
                raise ValueError("SECRET_KEY must be a strong non-default value in production")
            if self.moyasar_secret_key and not self.moyasar_webhook_secret:
                raise ValueError(
                    "MOYASAR_WEBHOOK_SECRET must be set in production when Moyasar payments are enabled"
                )
        return self

    @property
    def cors_origins_list(self) -> list[str]:
        return [origin.strip() for origin in self.cors_origins.split(",")]


settings = Settings()
