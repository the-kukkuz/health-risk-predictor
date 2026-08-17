"""Heart-disease prediction service -- PLACEHOLDER / INTEGRATION STUB.

The heart ML pipeline is being developed independently. This stub implements
the SAME `DiseasePredictionService` interface but deliberately returns
`not_ready` (HTTP 503) instead of any prediction. It must NEVER fabricate
probabilities, labels, or SHAP values.

INTEGRATION INSTRUCTIONS (for the heart module developer)
---------------------------------------------------------
Replace the body of this class (or provide a new implementation) with real
inference, while keeping the interface identical:

    1. Drop the trained artifact at  models/heart/heart_model.joblib
       and metadata at  models/heart/metadata.json.
    2. Implement predict(input_data) returning the common PredictionResponse
       shape (disease="heart_disease").
    3. Implement explain(input_data) returning list[Factor] via SHAP.
    4. Implement get_model_metadata() returning ModelInfo(status="ready", ...).
    5. No changes are needed to: routes, the registry wiring below, the
       database schema, the React frontend, Docker, or Kubernetes.

Expected predict() payload (same shape as diabetes):
    {
        "disease": "heart_disease",
        "prediction": 0 | 1,
        "probability": 0.XX,
        "risk_band": "Low" | "Moderate" | "High",
        "threshold": 0.XX,
        "top_factors": [ {"feature","impact","direction"} ... ]
    }
"""
from __future__ import annotations

from app.schemas.prediction import ModelInfo
from app.services.prediction_service import (
    DiseasePredictionService,
    ModuleNotReadyError,
)

NOT_READY_MESSAGE = (
    "Heart disease prediction module is currently being integrated."
)


class HeartPredictionService(DiseasePredictionService):
    disease = "heart_disease"

    def is_ready(self) -> bool:
        # When the real model is integrated, flip this to reflect load state.
        return False

    def predict(self, input_data: dict):
        raise ModuleNotReadyError(self.disease, NOT_READY_MESSAGE)

    def explain(self, input_data: dict):
        raise ModuleNotReadyError(self.disease, NOT_READY_MESSAGE)

    def get_model_metadata(self) -> ModelInfo:
        # Metadata is intentionally available so the frontend/UI can show the
        # module state without triggering a prediction. The service reports
        # status="not_ready" and no metrics.
        return ModelInfo(
            disease=self.disease,
            status="not_ready",
            feature_names=[],
            message=NOT_READY_MESSAGE,
        )

    def statistics(self) -> dict:
        # No heart analytics are fabricated. Return an explicit not_ready state
        # that the frontend renders gracefully.
        return {
            "disease": self.disease,
            "status": "not_ready",
            "message": NOT_READY_MESSAGE,
        }
