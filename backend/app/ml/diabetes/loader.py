"""Singleton loader for the diabetes inference artifact.

The model is loaded EXACTLY ONCE at application startup. No training,
cross-validation, tuning, or refitting occurs during a request. The SHAP
explainer is also built once here and reused across requests.
"""
from __future__ import annotations

import json
import logging
import threading
from pathlib import Path
from typing import Optional

import joblib

from app.core.config import get_settings

logger = logging.getLogger(__name__)

# The ml/ package is not packaged; add it to sys.path so the training-time
# inference helpers (predict.py, explain.py) are importable.
import sys  # noqa: E402

_ML_ROOT = Path(__file__).resolve().parents[4] / "ml"
if str(_ML_ROOT) not in sys.path:
    sys.path.insert(0, str(_ML_ROOT))

_DIABETES_ML = _ML_ROOT / "diabetes"
if str(_DIABETES_ML) not in sys.path:
    sys.path.insert(0, str(_DIABETES_ML))


class DiabetesModelBundle:
    """Holds the loaded artifact, metadata, and the reusable SHAP explainer."""

    def __init__(self) -> None:
        self.artifact: Optional[dict] = None
        self.metadata: Optional[dict] = None
        self.explainer = None
        self.loaded = False
        self.error: Optional[str] = None

    def load(self) -> None:
        settings = get_settings()
        model_path = settings.model_path
        metadata_path = settings.metadata_path

        if not model_path.exists():
            self.error = (
                f"Diabetes model artifact not found at {model_path}. "
                "Run `python ml/diabetes/train.py` first."
            )
            logger.error(self.error)
            return

        logger.info("Loading diabetes model artifact from %s", model_path)
        self.artifact = joblib.load(model_path)

        if metadata_path.exists():
            with open(metadata_path) as f:
                self.metadata = json.load(f)

        # Build the SHAP explainer once at startup for fast per-request XAI.
        try:
            import explain  # type: ignore

            logger.info("Building SHAP explainer (one-time startup cost)...")
            self.explainer = explain.build_explainer(self.artifact)
            logger.info("SHAP explainer ready.")
        except Exception as exc:  # pragma: no cover - defensive
            logger.warning("SHAP explainer could not be built: %s", exc)
            self.explainer = None

        self.loaded = True
        logger.info(
            "Diabetes model ready: family=%s threshold=%s",
            self.artifact.get("family"),
            self.artifact.get("threshold"),
        )

    # --- thin wrappers around the training-time helpers -----------------
    def predict(self, record: dict) -> dict:
        import predict  # type: ignore

        return predict.predict_one(self.artifact, record)

    def explain(self, record: dict, top_n: int = 5) -> list:
        import explain  # type: ignore

        return explain.explain_one(
            self.artifact, record, explainer=self.explainer, top_n=top_n
        )


_bundle: Optional[DiabetesModelBundle] = None
_lock = threading.Lock()


def get_bundle() -> DiabetesModelBundle:
    """Return the process-wide singleton bundle, loading it on first use."""
    global _bundle
    if _bundle is None:
        with _lock:
            if _bundle is None:
                _bundle = DiabetesModelBundle()
                if get_settings().load_ml_model:
                    _bundle.load()
    return _bundle


def reset_bundle() -> None:
    """Test helper: force a reload on next access."""
    global _bundle
    with _lock:
        _bundle = None
