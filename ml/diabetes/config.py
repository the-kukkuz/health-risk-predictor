"""Configuration for the diabetes ML pipeline.

All tunable constants live here so that training, inference, and the API
share a single source of truth. Nothing in this module performs training.
"""
from __future__ import annotations

from pathlib import Path

# --------------------------------------------------------------------------
# Paths
# --------------------------------------------------------------------------
# ml/diabetes/ -> repo root
REPO_ROOT = Path(__file__).resolve().parents[2]
DATA_DIR = REPO_ROOT / "data" / "diabetes"
MODELS_DIR = REPO_ROOT / "models" / "diabetes"
DATA_PATH = DATA_DIR / "pima-indians-diabetes.csv"
ARTIFACT_PATH = MODELS_DIR / "diabetes_model.joblib"
METADATA_PATH = MODELS_DIR / "metadata.json"

# --------------------------------------------------------------------------
# Dataset schema (UCI Pima Indians Diabetes)
# --------------------------------------------------------------------------
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
TARGET_NAME = "Outcome"
ALL_COLUMNS = FEATURE_NAMES + [TARGET_NAME]

# Columns where a value of 0 is clinically implausible and must be treated
# as missing. Pregnancies=0 is valid and is intentionally NOT in this list.
ZERO_IS_MISSING = ["Glucose", "BloodPressure", "SkinThickness", "Insulin", "BMI"]

# Per-feature acceptable numeric ranges used for input validation at the API
# boundary. These are sanity bounds, not clinical cutoffs.
FEATURE_RANGES = {
    "Pregnancies": (0.0, 25.0),
    "Glucose": (0.0, 500.0),
    "BloodPressure": (0.0, 250.0),
    "SkinThickness": (0.0, 150.0),
    "Insulin": (0.0, 1500.0),
    "BMI": (0.0, 100.0),
    "DiabetesPedigreeFunction": (0.0, 5.0),
    "Age": (0.0, 120.0),
}

# --------------------------------------------------------------------------
# Reproducibility / resampling
# --------------------------------------------------------------------------
RANDOM_STATE = 42
TEST_SIZE = 0.20
CV_FOLDS = 5

# --------------------------------------------------------------------------
# Candidate decision thresholds (the 0.5 default is NOT assumed).
# Selection is performed on cross-validated training predictions ONLY; the
# held-out test set is never used to pick the threshold.
# --------------------------------------------------------------------------
CANDIDATE_THRESHOLDS = [0.20, 0.25, 0.30, 0.35, 0.40, 0.45, 0.50]

# When selecting a threshold we prioritize recall but require a modest
# precision floor so the chosen model is not degenerate.
THRESHOLD_PRECISION_FLOOR = 0.50

# --------------------------------------------------------------------------
# Model-defined risk bands.
# These are MODEL risk categories, NOT clinically validated diagnoses.
# Keys are the (inclusive lower, exclusive upper) probability bounds.
# --------------------------------------------------------------------------
RISK_BANDS = {
    "Low": (0.0, 0.33),
    "Moderate": (0.33, 0.66),
    "High": (0.66, 1.01),
}
RISK_BAND_LABELS = ["Low", "Moderate", "High"]

# --------------------------------------------------------------------------
# Model identity
# --------------------------------------------------------------------------
MODEL_NAME = "diabetes_risk_classifier"
MODEL_VERSION = "1.0.0"

# --------------------------------------------------------------------------
# Small, targeted hyper-parameter grids (recall-oriented, laptop-fast)
# --------------------------------------------------------------------------
PARAM_GRIDS = {
    "logistic_regression": {
        "clf__C": [0.1, 1.0, 10.0],
        "clf__class_weight": [None, "balanced"],
    },
    "svm": {
        "clf__C": [0.5, 1.0, 2.0],
        "clf__kernel": ["rbf"],
        "clf__probability": [True],
        "clf__class_weight": [None, "balanced"],
    },
    "random_forest": {
        "clf__n_estimators": [200, 400],
        "clf__max_depth": [4, 6],
        "clf__min_samples_leaf": [2, 5],
        "clf__class_weight": ["balanced"],
    },
    "gradient_boosting": {
        "clf__n_estimators": [150],
        "clf__learning_rate": [0.05, 0.1],
        "clf__max_depth": [2, 3],
        "clf__subsample": [0.9],
    },
}

# When selecting among eligible families, two models within this recall delta
# are considered comparable. Tree-based models (instant TreeSHAP, fast
# production inference) are then preferred over SVM (slow permutation SHAP).
RECALL_TIE_DELTA = 0.03

# Relative inference/SHAP speed preference (higher = preferred at near-equal recall).
INFERENCE_SPEED_RANK = {
    "logistic_regression": 3,  # fast LinearSHAP
    "random_forest": 3,        # fast TreeSHAP
    "gradient_boosting": 3,    # fast TreeSHAP
    "svm": 1,                  # slow permutation SHAP
}

# Number of training rows to keep as a background summary for SHAP.
SHAP_BACKGROUND_SIZE = 100
TOP_FACTORS = 5
