"""Application settings loaded from environment variables.

No credentials are hard-coded. All sensitive values come from the environment
(.env in local development, Kubernetes secrets in production).
"""
from __future__ import annotations

from functools import lru_cache
from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict


# backend/app/core/config.py -> backend/ -> repo root
REPO_ROOT = Path(__file__).resolve().parents[3]
DEFAULT_MODEL_DIR = REPO_ROOT / "models" / "diabetes"
DEFAULT_DATA_DIR = REPO_ROOT / "data" / "diabetes"


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    # API
    app_name: str = "Health Risk Predictor"
    environment: str = "development"
    api_v1_prefix: str = "/api/v1"
    cors_origins: str = "http://localhost:5173,http://localhost:3000,http://localhost:8080"

    # Database (URL assembled from parts if the full URL is not supplied)
    database_url: str | None = None
    postgres_user: str = "riskapp"
    postgres_password: str = "riskapp"
    postgres_db: str = "healthrisk"
    postgres_host: str = "postgres"
    postgres_port: int = 5432

    # Model / data locations (overridable for tests)
    model_dir: str = str(DEFAULT_MODEL_DIR)
    data_dir: str = str(DEFAULT_DATA_DIR)
    load_ml_model: bool = True

    @property
    def sqlalchemy_database_uri(self) -> str:
        if self.database_url:
            return self.database_url
        return (
            f"postgresql+psycopg2://{self.postgres_user}:{self.postgres_password}"
            f"@{self.postgres_host}:{self.postgres_port}/{self.postgres_db}"
        )

    @property
    def cors_origin_list(self) -> list[str]:
        return [o.strip() for o in self.cors_origins.split(",") if o.strip()]

    @property
    def model_path(self) -> Path:
        return Path(self.model_dir) / "diabetes_model.joblib"

    @property
    def metadata_path(self) -> Path:
        return Path(self.model_dir) / "metadata.json"

    @property
    def analytics_data_path(self) -> Path:
        return Path(self.data_dir) / "pima-indians-diabetes.csv"


@lru_cache
def get_settings() -> Settings:
    return Settings()
