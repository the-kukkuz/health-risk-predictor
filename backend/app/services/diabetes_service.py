"""Diabetes-specific prediction service.

Implements the common `DiseasePredictionService` interface using the singleton
model bundle loaded at startup. No training happens here.
"""
from __future__ import annotations

import logging

from app.ml.diabetes.loader import get_bundle
from app.schemas.prediction import Factor, ModelInfo, PredictionResponse
from app.services.prediction_service import (
    DiseasePredictionService,
    ModuleNotReadyError,
)

logger = logging.getLogger(__name__)

DISCLAIMER = (
    "This system provides machine-learning-based risk stratification for "
    "research and decision-support purposes. It is not a medical diagnostic "
    "tool and should not be used as a substitute for professional medical "
    "evaluation."
)


class DiabetesPredictionService(DiseasePredictionService):
    disease = "diabetes"

    def __init__(self) -> None:
        self._bundle = get_bundle()

    def is_ready(self) -> bool:
        return bool(self._bundle.loaded and self._bundle.artifact is not None)

    def _require_ready(self) -> None:
        if not self.is_ready():
            raise ModuleNotReadyError(
                self.disease,
                self._bundle.error
                or "Diabetes prediction module is not currently available.",
            )

    def predict(self, input_data: dict) -> PredictionResponse:
        self._require_ready()
        result = self._bundle.predict(input_data)
        factors = self._bundle.explain(input_data)
        return PredictionResponse(
            disease=self.disease,
            prediction=result["prediction"],
            probability=result["probability"],
            risk_band=result["risk_band"],
            threshold=result["threshold"],
            top_factors=[Factor(**f) for f in factors],
            model_version=self._bundle.artifact.get("model_version"),
            disclaimer=DISCLAIMER,
        )

    def explain(self, input_data: dict) -> list[Factor]:
        self._require_ready()
        return [Factor(**f) for f in self._bundle.explain(input_data)]

    def get_model_metadata(self) -> ModelInfo:
        self._require_ready()
        art = self._bundle.artifact
        meta = self._bundle.metadata or {}
        return ModelInfo(
            disease=self.disease,
            status="ready",
            model_name=art.get("model_name"),
            model_version=art.get("model_version"),
            selected_family=art.get("family"),
            feature_names=list(art.get("feature_names", [])),
            threshold=art.get("threshold"),
            risk_bands=art.get("risk_bands"),
            test_metrics=meta.get("test_metrics"),
            validation_metrics=meta.get("validation_metrics_ooof"),
        )

    def statistics(self) -> dict:
        """Population-level diabetes analytics computed from the raw dataset."""
        from app.services.analytics import compute_diabetes_analytics

        return compute_diabetes_analytics(self._bundle)
