"""Population analytics endpoint (disease-agnostic)."""
from __future__ import annotations

from fastapi import APIRouter, HTTPException

from app.services.prediction_service import (
    ModuleNotReadyError,
    get_prediction_service,
)

router = APIRouter(prefix="/api/v1/statistics", tags=["statistics"])


@router.get("/{disease}")
def statistics(disease: str) -> dict:
    try:
        service = get_prediction_service(disease)
    except KeyError:
        raise HTTPException(status_code=404, detail=f"Unknown disease module: {disease}")

    try:
        return service.statistics()
    except ModuleNotReadyError as exc:
        raise HTTPException(
            status_code=503,
            detail={
                "status": "not_ready",
                "disease": exc.disease,
                "message": exc.message,
            },
        )
