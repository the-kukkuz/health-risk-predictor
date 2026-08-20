"""Local SHAP explanations for a loaded heart artifact.

The explainer is built once (by the backend at startup) from the fitted
preprocessor + classifier and a small transformed background sample. SHAP
values are computed per-request on a single transformed row, so no refitting
or full-dataset computation happens during inference.
"""
from __future__ import annotations

from typing import Dict, List, Optional

import numpy as np
import pandas as pd
import shap

from .config import TOP_FACTORS
from .preprocessing import CATEGORICAL_COLS, NUMERICAL_COLS


def validate_inputs(record: Dict) -> pd.DataFrame:
    """Validate and convert a single record into a DataFrame for preprocessing."""
    expected_cols = set(NUMERICAL_COLS + CATEGORICAL_COLS)
    missing = expected_cols - set(record.keys())
    if missing:
        raise ValueError(f"Missing expected input features: {missing}")
    
    # Extract only expected features to maintain column order consistency
    ordered_record = {col: [record[col]] for col in NUMERICAL_COLS + CATEGORICAL_COLS}
    return pd.DataFrame(ordered_record)


def build_explainer(artifact: Dict):
    """Construct a SHAP explainer for the stored classifier.

    Uses shap.Explainer which auto-selects the fastest supported algorithm.
    """
    classifier = artifact["classifier"]
    background = artifact["X_background"]

    def predict_positive(X_trans: np.ndarray) -> np.ndarray:
        proba = classifier.predict_proba(np.asarray(X_trans, dtype=float))
        return proba[:, 1]

    try:
        explainer = shap.Explainer(
            predict_positive,
            background,
            feature_names=artifact["feature_names"],
            algorithm="auto",
        )
        # Warm it up
        _ = explainer(background[:1])
        return explainer
    except Exception:
        return shap.Explainer(
            predict_positive,
            background,
            feature_names=artifact["feature_names"],
            algorithm="permutation",
            seed=42,
        )


def _extract_shap_values(shap_values) -> np.ndarray:
    """Return a 1D array of per-feature SHAP values regardless of shap output shape."""
    arr = np.asarray(shap_values.values)
    if arr.ndim == 2:
        if arr.shape[1] == 2:
            return arr[:, 1]
        return arr[0]
    if arr.ndim == 3:
        return arr[0, :, 1]
    return arr.ravel()


def explain_one(
    artifact: Dict,
    record: Dict,
    explainer=None,
    top_n: int = TOP_FACTORS,
) -> List[Dict]:
    """Return the top-N contributing features for a single record.

    Each factor: {feature, impact (magnitude), direction, shap_value (signed)}.
    """
    X = validate_inputs(record)
    X_trans = artifact["preprocessor"].transform(X).astype(float)

    if explainer is None:
        explainer = build_explainer(artifact)

    shap_out = explainer(X_trans)
    values = _extract_shap_values(shap_out)

    factors = []
    for name, val in zip(artifact["feature_names"], values):
        factors.append(
            {
                "feature": name,
                "shap_value": round(float(val), 6),
                "impact": round(float(abs(val)), 6),
                "direction": (
                    "increases_risk" if val > 0 else "decreases_risk"
                ),
            }
        )

    factors.sort(key=lambda f: f["impact"], reverse=True)
    return factors[:top_n]
