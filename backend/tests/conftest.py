"""Pytest fixtures: isolated SQLite DB + TestClient with the real ML model."""
from __future__ import annotations

import os
import sys
from pathlib import Path

import pytest

# Ensure the backend package is importable.
BACKEND_DIR = Path(__file__).resolve().parents[1]
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))

# Use an isolated SQLite database for tests BEFORE app imports engine.
TEST_DB_PATH = BACKEND_DIR / "test_pytest.db"
if TEST_DB_PATH.exists():
    TEST_DB_PATH.unlink()
os.environ["DATABASE_URL"] = f"sqlite:///{TEST_DB_PATH}"
# Ensure the trained model is loaded from the repo's models/ dir.
os.environ.setdefault("MODEL_DIR", str(BACKEND_DIR.parent / "models" / "diabetes"))
os.environ.setdefault("DATA_DIR", str(BACKEND_DIR.parent / "data" / "diabetes"))


@pytest.fixture(scope="session")
def client():
    from fastapi.testclient import TestClient
    from app.main import app

    with TestClient(app) as c:
        yield c

    if TEST_DB_PATH.exists():
        TEST_DB_PATH.unlink()


@pytest.fixture
def valid_diabetes_payload() -> dict:
    return {
        "Pregnancies": 6,
        "Glucose": 148,
        "BloodPressure": 72,
        "SkinThickness": 35,
        "Insulin": 0,
        "BMI": 33.6,
        "DiabetesPedigreeFunction": 0.627,
        "Age": 50,
    }
