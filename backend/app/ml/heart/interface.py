"""Heart disease module integration interface.

This file documents (and re-exports) the exact contract the independently
developed heart module must satisfy. It intentionally contains NO ML logic.

The heart developer should implement a concrete subclass of
`DiseasePredictionService` (see app.services.prediction_service) and register
it. The rest of the system -- API, database, frontend, Docker, Kubernetes --
requires no changes.

Contract
--------
predict(input_data: dict) -> PredictionResponse
    {
        "disease": "heart_disease",
        "prediction": 0 | 1,
        "probability": float,           # 0..1, calibrated where possible
        "risk_band": "Low"|"Moderate"|"High",
        "threshold": float,             # decision threshold used
        "top_factors": [                # local SHAP factors
            {"feature": str, "impact": float, "direction": "increases_risk"|"decreases_risk"}
        ],
        "model_version": str
    }

explain(input_data: dict) -> list[Factor]

get_model_metadata() -> ModelInfo
    {
        "model_name": str, "model_version": str,
        "metrics": {...}, "features": [...]
    }

Rules
~~~~~
* Never fabricate metrics or predictions.
* Fit all preprocessing on training data only.
* Load the model ONCE at startup; never train during a request.
* Risk bands are model-defined, not clinical categories.
"""
from __future__ import annotations

from app.services.prediction_service import (  # noqa: F401
    DiseasePredictionService,
    ModuleNotReadyError,
)
from app.services.heart_service import HeartPredictionService  # noqa: F401

# When integrating, replace HeartPredictionService with the real implementation
# and register it in app.services.registry (currently done in main.py).
__all__ = [
    "DiseasePredictionService",
    "HeartPredictionService",
    "ModuleNotReadyError",
]
