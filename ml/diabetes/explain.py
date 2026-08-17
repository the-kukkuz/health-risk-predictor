"""Local SHAP explanations for a loaded diabetes artifact.

The explainer is built once (by the backend at startup) from the fitted
preprocessor + classifier and a small transformed background sample. SHAP
values are computed per-request on a single transformed row, so no refitting
or full-dataset computation happens during inference.

Wording note: contributions are described as "contributed to the model
prediction" -- never as having "caused" a clinical outcome.
"""
from __future__ import annotations

from typing import Dict, List, Optional

import numpy as np
import pandas as pd
import shap

from config import TOP_FACTORS
from predict import validate_inputs


def build_explainer(artifact: Dict):
    """Construct a SHAP explainer for the stored classifier.

    Uses shap.Explainer which auto-selects the fastest supported algorithm
    (Tree for tree ensembles, Linear for linear models, and a permutation/
    sampling fallback otherwise). The callable passed to it predicts the
    positive-class probability on ALREADY-TRANSFORMED data.
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
        # Warm it up so the first request is not slow.
        _ = explainer(background[:1])
        return explainer
    except Exception:
        # Robust fallback: permutation explainer works for any classifier.
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
    # Explanation output can be (n_features, n_classes) for classifiers that
    # return per-class matrices; we want the positive class.
    if arr.ndim == 2:
        if arr.shape[1] == 2:
            return arr[:, 1]
        return arr[0]
    if arr.ndim == 3:
        # (1, n_features, 2) -> positive-class column
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
