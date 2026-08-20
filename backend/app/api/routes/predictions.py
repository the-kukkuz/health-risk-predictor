"""List persisted prediction metadata."""
from __future__ import annotations

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.db.session import get_db
from app.models.prediction import PredictionRecord
from app.schemas.prediction import PredictionListResponse, PredictionRecordOut

router = APIRouter(prefix="/api/v1/predictions", tags=["predictions"])


@router.get("", response_model=PredictionListResponse)
def list_predictions(
    limit: int = Query(100, ge=1, le=500),
    offset: int = Query(0, ge=0),
    disease: str | None = Query(None),
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user),
) -> PredictionListResponse:
    q = db.query(PredictionRecord)
    
    # RBAC: Patients only view their own history; admins view all history.
    user_metadata = current_user.user_metadata or {}
    user_role = user_metadata.get("role", "user")
    if user_role != "admin":
        q = q.filter(PredictionRecord.user_id == current_user.id)

    if disease:
        q = q.filter(PredictionRecord.disease_type == disease)
    total = q.count()
    rows = (
        q.order_by(PredictionRecord.created_at.desc())
        .offset(offset)
        .limit(limit)
        .all()
    )
    items = [
        PredictionRecordOut(
            id=r.id,
            disease_type=r.disease_type,
            model_version=r.model_version,
            prediction=r.prediction,
            probability=round(r.probability, 4),
            risk_band=r.risk_band,
            threshold=round(r.threshold, 4),
            user_id=r.user_id,
            created_at=r.created_at.isoformat() if r.created_at else None,
        )
        for r in rows
    ]
    return PredictionListResponse(items=items, total=total)
