"""Population-level analytics for the diabetes dataset.

Computed on demand from the raw UCI data and the trained model's metadata.
Designed so a future heart module can add its own analytics by overriding
`DiseasePredictionService.statistics()` -- no frontend redesign is needed.
"""
from __future__ import annotations

from pathlib import Path

import numpy as np
import pandas as pd

from app.core.config import get_settings

FEATURE_NAMES = [
    "Pregnancies",
    "Glucose",
    "BloodPressure",
    "SkinThickness",
    "Insulin",
    "BMI",
    "DiabetesPedigreeFunction",
    "Age",
]
ZERO_IS_MISSING = ["Glucose", "BloodPressure", "SkinThickness", "Insulin", "BMI"]


def _load_clean() -> pd.DataFrame:
    path = Path(get_settings().analytics_data_path)
    df = pd.read_csv(
        path,
        header=None,
        names=FEATURE_NAMES + ["Outcome"],
    )
    for c in ZERO_IS_MISSING:
        df.loc[df[c] == 0, c] = np.nan
    return df


def _hist(series: pd.Series, bins: int, lo: float, hi: float) -> dict:
    s = series.dropna()
    counts, edges = np.histogram(s, bins=bins, range=(lo, hi))
    return {
        "bins": [f"{edges[i]:.0f}-{edges[i+1]:.0f}" for i in range(len(edges) - 1)],
        "counts": [int(c) for c in counts],
    }


def compute_diabetes_analytics(bundle) -> dict:
    df = _load_clean()
    meta = bundle.metadata or {}
    test_metrics = meta.get("test_metrics", {})
    risk_bands = bundle.artifact.get("risk_bands", {})

    # Risk distribution: apply the trained model's own threshold to the dataset
    # positive-class probability is expensive; instead use outcome-based counts
    # plus model risk-band projection on a sample. For speed & transparency we
    # report the dataset outcome distribution and binned glucose/BMI/age.
    outcome_counts = df["Outcome"].value_counts().to_dict()

    # Project risk bands for the whole dataset through the trained pipeline.
    proba = bundle.artifact["pipeline"].predict_proba(df[FEATURE_NAMES])[:, 1]
    threshold = bundle.artifact["threshold"]
    from predict import assign_risk_band  # type: ignore

    bands = pd.Series([assign_risk_band(float(p), risk_bands) for p in proba])
    band_counts = bands.value_counts().reindex(["Low", "Moderate", "High"]).fillna(0)

    age_hist = _hist(df["Age"], bins=8, lo=20, hi=80)
    bmi_groups = df.groupby("Outcome")["BMI"].median().round(1).to_dict()
    glucose_groups = df.groupby("Outcome")["Glucose"].median().round(1).to_dict()

    # Feature importance: for linear models use standardized coefficients.
    classifier = bundle.artifact["classifier"]
    importances = _feature_importance(classifier, FEATURE_NAMES)

    # BMI vs outcome binned
    bmi_bins = [0, 18.5, 25, 30, 35, 40, 100]
    bmi_labels = ["<18.5", "18.5-25", "25-30", "30-35", "35-40", "40+"]
    df["BMI_bin"] = pd.cut(df["BMI"], bins=bmi_bins, labels=bmi_labels, right=False)
    bmi_outcome = (
        df.groupby("BMI_bin", observed=False)["Outcome"]
        .agg(["count", "mean"])
        .reset_index()
    )
    bmi_outcome["mean"] = bmi_outcome["mean"].round(3)

    return {
        "disease": "diabetes",
        "status": "ready",
        "n_records": int(len(df)),
        "outcome_distribution": {
            "no_diabetes": int(outcome_counts.get(0, 0)),
            "diabetes": int(outcome_counts.get(1, 0)),
        },
        "risk_distribution": {
            "labels": ["Low", "Moderate", "High"],
            "counts": [int(band_counts["Low"]), int(band_counts["Moderate"]), int(band_counts["High"])],
        },
        "age_distribution": age_hist,
        "bmi_by_outcome": {
            "no_diabetes_median": float(bmi_groups.get(0, 0) or 0),
            "diabetes_median": float(bmi_groups.get(1, 0) or 0),
        },
        "glucose_by_outcome": {
            "no_diabetes_median": float(glucose_groups.get(0, 0) or 0),
            "diabetes_median": float(glucose_groups.get(1, 0) or 0),
        },
        "bmi_vs_outcome": {
            "bins": bmi_labels,
            "counts": [int(x) for x in bmi_outcome["count"].tolist()],
            "diabetes_rate": [float(x) for x in bmi_outcome["mean"].tolist()],
        },
        "feature_importance": importances,
        "model_performance": {
            "selected_family": bundle.artifact.get("family"),
            "threshold": float(threshold),
            "test_metrics": test_metrics,
        },
        "disclaimer": (
            "Population analytics are derived from the UCI Pima Indians dataset "
            "and are for research/decision-support only. Risk bands are "
            "model-defined, not clinical categories."
        ),
    }


def _feature_importance(classifier, feature_names: list[str]) -> dict:
    """Return a standardized feature-importance vector.

    For linear models uses absolute coefficients; for tree ensembles uses
    feature_importances_. Values are normalized to sum to 1.
    """
    vals = None
    if hasattr(classifier, "feature_importances_"):
        vals = np.asarray(classifier.feature_importances_, dtype=float)
    elif hasattr(classifier, "coef_"):
        vals = np.abs(np.asarray(classifier.coef_, dtype=float)).ravel()

    if vals is None or len(vals) != len(feature_names):
        return {"features": feature_names, "values": [0.0] * len(feature_names)}

    total = vals.sum()
    if total > 0:
        vals = vals / total
    return {
        "features": list(feature_names),
        "values": [round(float(v), 4) for v in vals],
    }
