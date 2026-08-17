"""Common disease prediction service interface + service registry.

THIS IS THE INTEGRATION CONTRACT.

Every disease module (diabetes now, heart disease later) must implement
`DiseasePredictionService`. The API and frontend depend ONLY on this interface
and on the common response shapes -- they never know how a specific model is
built. To integrate the independently developed heart module, a developer only
needs to:

  1. drop the heart model artifact under models/heart/
  2. implement HeartPredictionService against this ABC
  3. (no frontend / API / DB / Docker / K8s changes required)

The `SERVICE_REGISTRY` maps the disease key used in the URL
(POST /api/v1/predict/{disease}) to a lazy service constructor.
"""
from __future__ import annotations

from abc import ABC, abstractmethod
from typing import Callable, Dict

from app.schemas.prediction import (
    Factor,
    ModelInfo,
    PredictionResponse,
)


class DiseasePredictionService(ABC):
    """Abstract base class every disease-specific service implements."""

    #: Disease key as used in the API path, e.g. "diabetes".
    disease: str = ""

    @abstractmethod
    def is_ready(self) -> bool:
        """Return True if the underlying model is loaded and usable."""
        raise NotImplementedError

    @abstractmethod
    def predict(self, input_data: dict) -> PredictionResponse:
        """Validate input, run inference + SHAP, return the common response.

        Must raise a ModuleNotReadyError (or return an appropriate HTTP error)
        rather than fabricating predictions when the model is unavailable.
        """
        raise NotImplementedError

    @abstractmethod
    def explain(self, input_data: dict) -> list[Factor]:
        """Return local (SHAP) factors for a single input record."""
        raise NotImplementedError

    @abstractmethod
    def get_model_metadata(self) -> ModelInfo:
        """Return model name, version, metrics, features, threshold, bands."""
        raise NotImplementedError

    def statistics(self) -> dict:
        """Optional population analytics. Default: empty (module may override)."""
        return {}


class ModuleNotReadyError(RuntimeError):
    """Raised when a disease module is registered but not yet implemented/loaded."""

    def __init__(self, disease: str, message: str):
        super().__init__(message)
        self.disease = disease
        self.message = message


# --------------------------------------------------------------------------
# Service registry / factory
# --------------------------------------------------------------------------
SERVICE_REGISTRY: Dict[str, Callable[[], DiseasePredictionService]] = {}


def register_service(disease: str, factory: Callable[[], DiseasePredictionService]) -> None:
    SERVICE_REGISTRY[disease] = factory


def get_prediction_service(disease: str) -> DiseasePredictionService:
    """Return a disease-specific service instance.

    Raises KeyError for unknown diseases (API maps this to 404).
    """
    if disease not in SERVICE_REGISTRY:
        raise KeyError(f"Unknown disease module: {disease!r}")
    return SERVICE_REGISTRY[disease]()


def available_diseases() -> list[str]:
    return list(SERVICE_REGISTRY.keys())
