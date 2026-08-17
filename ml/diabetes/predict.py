"""Inference helpers for a loaded diabetes artifact.

These functions operate on an already-loaded artifact (joblib dict) so the API
never reloads or refits anything during a request.
"""
from __future__ import annotations

from typing import Dict, List, Tuple

import numpy as np
import pandas as pd

from config import FEATURE_NAMES, RISK_BANDS


class InferenceError(RuntimeError):
    pass


def validate_inputs(record: Dict) -> pd.DataFrame:
    """Validate a single input record and return a one-row DataFrame.

    Raises ValueError on missing/extra/out-of-range features. The API layer
    also validates via Pydantic; this is the ML-side guard.
    """
    missing = [f for f in FEATURE_NAMES if f not in record]
    if missing:
        raise ValueError(f"Missing required features: {missing}")

    extra = [k for k in record if k not in FEATURE_NAMES]
    if extra:
        raise ValueError(f"Unknown features: {extra}")

    row = {}
    for f in FEATURE_NAMES:
        v = record[f]
        if v is None:
            raise ValueError(f"Feature '{f}' must not be null.")
        try:
            row[f] = float(v)
        except (TypeError, ValueError):
            raise ValueError(f"Feature '{f}' must be numeric, got {v!r}")

    return pd.DataFrame([row], columns=FEATURE_NAMES)


def predict_proba(artifact: Dict, X: pd.DataFrame) -> np.ndarray:
    """Return the positive-class probability using the loaded pipeline."""
    pipeline = artifact["pipeline"]
    proba = pipeline.predict_proba(X)
    return proba[:, 1].astype(float)


def apply_threshold(proba: float, threshold: float) -> int:
    return int(proba >= threshold)


def assign_risk_band(proba: float, risk_bands: Dict = RISK_BANDS) -> str:
    """Map a probability to a configured model risk band."""
    for label in ["Low", "Moderate", "High"]:
        lo, hi = risk_bands[label]
        if lo <= proba < hi:
            return label
    # Float at exactly 1.0 falls into the last band (its upper bound is > 1).
    return "High"


def predict_one(artifact: Dict, record: Dict) -> Dict:
    """Full single-record inference: validation -> proba -> label -> band."""
    X = validate_inputs(record)
    proba = float(predict_proba(artifact, X)[0])
    threshold = float(artifact["threshold"])
    prediction = apply_threshold(proba, threshold)
    risk_band = assign_risk_band(proba, artifact["risk_bands"])
    return {
        "disease": "diabetes",
        "prediction": prediction,
        "probability": round(proba, 4),
        "risk_band": risk_band,
        "threshold": round(threshold, 4),
    }
