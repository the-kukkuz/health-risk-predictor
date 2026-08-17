"""Model metadata listing endpoint."""
from __future__ import annotations

from fastapi import APIRouter

from app.schemas.prediction import ModelInfo
from app.services.prediction_service import get_prediction_service

router = APIRouter(prefix="/api/v1", tags=["models"])


@router.get("/models", response_model=list[ModelInfo])
def list_models() -> list[ModelInfo]:
    """Return metadata for every registered disease module."""
    out = []
    for disease in ("diabetes", "heart"):
        service = get_prediction_service(disease)
        out.append(service.get_model_metadata())
    return out
