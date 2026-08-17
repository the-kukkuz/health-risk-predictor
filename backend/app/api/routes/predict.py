"""Disease-agnostic prediction route.

POST /api/v1/predict/{disease}

The frontend knows ONLY this route and the common response shape. The backend
selects the disease-specific service via the registry, so diabetes (live) and
heart (placeholder, future) are interchangeable behind the same contract.
"""
from __future__ import annotations

import logging

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.prediction import PredictionRecord
from app.schemas.prediction import (
    DiabetesFeatures,
    PredictionResponse,
)
from app.services.prediction_service import (
    ModuleNotReadyError,
    get_prediction_service,
)

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/v1/predict", tags=["predict"])

# Map disease path-key -> request schema. When the heart module is integrated,
# add its feature schema here. No other route logic needs to change.
REQUEST_SCHEMAS = {
    "diabetes": DiabetesFeatures,
}


@router.post("/{disease}", response_model=PredictionResponse)
def predict(
    disease: str,
    payload: dict,
    db: Session = Depends(get_db),
) -> PredictionResponse:
    # 1. Resolve service (404 for unknown diseases).
    try:
        service = get_prediction_service(disease)
    except KeyError:
        raise HTTPException(status_code=404, detail=f"Unknown disease module: {disease}")

    # 2. Validate the disease-specific input schema.
    schema_cls = REQUEST_SCHEMAS.get(disease)
    if schema_cls is None:
        # The module is registered but has no request schema yet (e.g. heart
        # placeholder). If it is not ready, return 503 with a clear message.
        if not service.is_ready():
            raise _not_ready(service.disease, service)
        raise HTTPException(
            status_code=501,
            detail=f"No input schema registered for disease module '{disease}'.",
        )

    try:
        features = schema_cls(**payload)
    except Exception as exc:
        raise HTTPException(status_code=422, detail=_format_validation_error(exc))

    # 3. Run inference.
    try:
        result = service.predict(features.model_dump())
    except ModuleNotReadyError as exc:
        raise _not_ready(service.disease, service)
    except ValueError as exc:
        # ML-side validation (invalid inputs that slipped past Pydantic).
        raise HTTPException(status_code=422, detail=str(exc))

    # 4. Persist disease-agnostic prediction metadata (no PII).
    try:
        record = PredictionRecord(
            disease_type=disease,
            model_version=result.model_version or "unknown",
            prediction=result.prediction,
            probability=result.probability,
            risk_band=result.risk_band,
            threshold=result.threshold,
        )
        db.add(record)
        db.commit()
    except Exception as exc:
        # A DB failure must not break a successful prediction response.
        logger.warning("Failed to persist prediction metadata: %s", exc)
        db.rollback()

    return result


def _not_ready(disease: str, service) -> HTTPException:
    meta = service.get_model_metadata()
    return HTTPException(
        status_code=503,
        detail={
            "status": "not_ready",
            "disease": disease,
            "message": meta.message
            or "This disease module is not currently available.",
        },
    )


def _format_validation_error(exc: Exception) -> dict:
    # Pydantic v2 ValidationError carries a .errors() list.
    errors = getattr(exc, "errors", None)
    if callable(errors):
        return {"status": "invalid_input", "errors": errors()}
    return {"status": "invalid_input", "message": str(exc)}
