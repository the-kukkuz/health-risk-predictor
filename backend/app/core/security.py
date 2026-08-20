"""JWT creation and verification using Supabase JWT secret.

Supports local JWT creation (for development) and Supabase-issued token
verification. The secret comes from `SUPABASE_JWT_SECRET` or `SECRET_KEY`.
"""
from __future__ import annotations

import os
from datetime import datetime, timedelta, timezone
from typing import Any

import jwt

# Fallback dev-only secret — production must set a strong SECRET_KEY.
DEFAULT_SECRET = "dev-secret-change-me-in-production"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24  # 24 hours


def get_secret_key() -> str:
    return (
        os.getenv("SECRET_KEY")
        or os.getenv("SUPABASE_JWT_SECRET")
        or DEFAULT_SECRET
    )


def create_access_token(user_id: str | int, expires_minutes: int | None = None) -> str:
    expire = datetime.now(timezone.utc) + timedelta(
        minutes=expires_minutes or ACCESS_TOKEN_EXPIRE_MINUTES
    )
    payload = {
        "sub": str(user_id),
        "exp": expire,
        "iat": datetime.now(timezone.utc),
    }
    return jwt.encode(payload, get_secret_key(), algorithm=ALGORITHM)


def decode_access_token(token: str) -> dict[str, Any]:
    """Decode and validate a JWT. Raises jwt.PyJWTError on failure."""
    return jwt.decode(token, get_secret_key(), algorithms=[ALGORITHM])