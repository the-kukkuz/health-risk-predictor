"""Singleton loader for the heart disease inference artifact.

The model is loaded EXACTLY ONCE at application startup.
"""
from __future__ import annotations

import json
import logging
import threading
from pathlib import Path
from typing import Optional

import joblib
import pandas as pd
import numpy as np

from app.core.config import get_settings

logger = logging.getLogger(__name__)

# The ml/ package is not packaged; add it to sys.path so the training-time
# inference helpers (predict.py, explain.py) are importable.
import sys  # noqa: E402

_ML_ROOT = Path(__file__).resolve().parents[4] / "ml"
if str(_ML_ROOT) not in sys.path:
    sys.path.insert(0, str(_ML_ROOT))


class HeartModelBundle:
    """Holds the loaded artifact, metadata, and the reusable SHAP explainer."""

    def __init__(self) -> None:
        self.artifact: Optional[dict] = None
        self.metadata: Optional[dict] = None
        self.explainer = None
        self.loaded = False
        self.error: Optional[str] = None

    def load(self) -> None:
        settings = get_settings()
        model_path = settings.heart_model_path
        metadata_path = settings.heart_metadata_path

        if not model_path.exists():
            self.error = (
                f"Heart model artifact not found at {model_path}. "
            )
            logger.error(self.error)
            return

        logger.info("Loading heart model artifact from %s", model_path)
        self.artifact = joblib.load(model_path)

        if metadata_path.exists():
            with open(metadata_path) as f:
                self.metadata = json.load(f)

        # Build the SHAP explainer once at startup for fast per-request XAI.
        try:
            from heart.src import explain  # type: ignore

            logger.info("Building SHAP explainer (one-time startup cost)...")
            self.explainer = explain.build_explainer(self.artifact)
            logger.info("SHAP explainer ready.")
        except Exception as exc:  # pragma: no cover - defensive
            logger.warning("SHAP explainer could not be built: %s", exc)
            self.explainer = None

        self.loaded = True
        logger.info(
            "Heart model ready: family=%s threshold=%s",
            self.artifact.get("family"),
            self.artifact.get("threshold"),
        )

    def predict(self, record: dict) -> dict:
        pipeline = self.artifact["pipeline"]
        feature_names = self.artifact["feature_names"]
        
        # Build one-row dataframe ensuring column order
        X = pd.DataFrame([record])[feature_names]
        
        proba = float(pipeline.predict_proba(X)[0, 1])
        threshold = float(self.artifact["threshold"])
        prediction = int(proba >= threshold)
        
        # Assign risk band
        risk_bands = self.artifact.get("risk_bands", {})
        risk_band = "High"
        for label, (lo, hi) in risk_bands.items():
            if lo <= proba < hi:
                risk_band = label
                break
                
        return {
            "disease": "heart",
            "prediction": prediction,
            "probability": round(proba, 4),
            "risk_band": risk_band,
            "threshold": round(threshold, 4),
        }

    def explain(self, record: dict, top_n: int = 5) -> list:
        from heart.src import explain  # type: ignore

        return explain.explain_one(
            self.artifact, record, explainer=self.explainer, top_n=top_n
        )

_bundle: Optional[HeartModelBundle] = None
_lock = threading.Lock()

def get_bundle() -> HeartModelBundle:
    global _bundle
    if _bundle is None:
        with _lock:
            if _bundle is None:
                _bundle = HeartModelBundle()
                if get_settings().load_ml_model:
                    _bundle.load()
    return _bundle

def reset_bundle() -> None:
    global _bundle
    with _lock:
        _bundle = None
