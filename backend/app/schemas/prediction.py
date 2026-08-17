"""Pydantic request/response schemas shared by every disease module.

The response shape is the SAME for diabetes and (future) heart disease, so the
frontend never needs disease-specific parsing logic.
"""
from __future__ import annotations

from typing import List, Literal, Optional

from pydantic import BaseModel, Field

# --------------------------------------------------------------------------
# Common response pieces
# --------------------------------------------------------------------------
RiskBand = Literal["Low", "Moderate", "High"]


class Factor(BaseModel):
    feature: str
    impact: float
    direction: Literal["increases_risk", "decreases_risk"]
    shap_value: Optional[float] = None


class ModelMetrics(BaseModel):
    threshold: float
    accuracy: float
    precision: float
    recall: float
    f1: float
    roc_auc: float


class ModelInfo(BaseModel):
    disease: str
    status: Literal["ready", "not_ready"]
    model_name: Optional[str] = None
    model_version: Optional[str] = None
    selected_family: Optional[str] = None
    feature_names: List[str] = Field(default_factory=list)
    threshold: Optional[float] = None
    risk_bands: Optional[dict] = None
    test_metrics: Optional[dict] = None
    validation_metrics: Optional[dict] = None
    message: Optional[str] = None


# --------------------------------------------------------------------------
# Diabetes request (8 UCI features). Validated at the API boundary.
# --------------------------------------------------------------------------
class DiabetesFeatures(BaseModel):
    model_config = {"extra": "forbid"}

    Pregnancies: float = Field(..., ge=0, le=25, description="Number of pregnancies")
    Glucose: float = Field(..., ge=0, le=500, description="Plasma glucose concentration")
    BloodPressure: float = Field(..., ge=0, le=250, description="Diastolic blood pressure (mm Hg)")
    SkinThickness: float = Field(..., ge=0, le=150, description="Triceps skin fold thickness (mm)")
    Insulin: float = Field(..., ge=0, le=1500, description="2-hour serum insulin (mu U/ml)")
    BMI: float = Field(..., ge=0, le=100, description="Body mass index")
    DiabetesPedigreeFunction: float = Field(..., ge=0, le=5, description="Diabetes pedigree function")
    Age: float = Field(..., ge=0, le=120, description="Age (years)")


# --------------------------------------------------------------------------
# Common prediction response (disease-agnostic)
# --------------------------------------------------------------------------
class PredictionResponse(BaseModel):
    disease: str
    prediction: int
    probability: float
    risk_band: RiskBand
    threshold: float
    top_factors: List[Factor] = Field(default_factory=list)
    model_version: Optional[str] = None
    disclaimer: Optional[str] = None


class PredictionRecordOut(BaseModel):
    id: int
    disease_type: str
    model_version: str
    prediction: int
    probability: float
    risk_band: str
    threshold: float
    created_at: Optional[str] = None


class PredictionListResponse(BaseModel):
    items: List[PredictionRecordOut]
    total: int


class HealthResponse(BaseModel):
    status: str
    database: str
