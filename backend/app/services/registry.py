"""Service registration.

Importing this module wires the diabetes (implemented) and heart (placeholder)
services into the common registry. To integrate the real heart module later,
register its implementation here -- nothing else in the API/frontend/DB changes.
"""
from __future__ import annotations

from app.services.diabetes_service import DiabetesPredictionService
from app.services.heart_service import HeartPredictionService
from app.services.prediction_service import register_service


def register_all_services() -> None:
    register_service("diabetes", DiabetesPredictionService)
    # Heart: placeholder. Replace with the real implementation when integrated.
    register_service("heart", HeartPredictionService)
