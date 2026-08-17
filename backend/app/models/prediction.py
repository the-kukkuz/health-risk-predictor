"""ORM model for persisted prediction metadata.

The schema is intentionally disease-agnostic: the same table stores diabetes
predictions now and heart-disease predictions later. No PII is stored; only
the model outputs and an opaque record id.
"""
from __future__ import annotations

from datetime import datetime

from sqlalchemy import DateTime, Float, Integer, String, func
from sqlalchemy.orm import Mapped, mapped_column

from app.db.session import Base


class PredictionRecord(Base):
    __tablename__ = "predictions"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)

    # Disease type as exposed in the API: "diabetes" | "heart_disease"
    disease_type: Mapped[str] = mapped_column(String(32), nullable=False, index=True)
    model_version: Mapped[str] = mapped_column(String(64), nullable=False)

    # Model outputs
    prediction: Mapped[int] = mapped_column(Integer, nullable=False)
    probability: Mapped[float] = mapped_column(Float, nullable=False)
    risk_band: Mapped[str] = mapped_column(String(16), nullable=False)
    threshold: Mapped[float] = mapped_column(Float, nullable=False)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False, index=True
    )

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "disease_type": self.disease_type,
            "model_version": self.model_version,
            "prediction": self.prediction,
            "probability": round(self.probability, 4),
            "risk_band": self.risk_band,
            "threshold": round(self.threshold, 4),
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }
