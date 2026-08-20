"""Configuration for the heart disease ML pipeline.

Tunable project configurations and paths share a single source of truth.
"""
from __future__ import annotations

from pathlib import Path

# --------------------------------------------------------------------------
# Paths
# --------------------------------------------------------------------------
# Path resolution relative to this file: ml/heart/src/config.py -> repo root
REPO_ROOT = Path(__file__).resolve().parents[3]
DATA_PATH = REPO_ROOT / "ml" / "heart" / "data" / "heart_disease.csv"
MODELS_DIR = REPO_ROOT / "models" / "heart"

# --------------------------------------------------------------------------
# Model Identity
# --------------------------------------------------------------------------
MODEL_NAME = "heart_risk_classifier"
MODEL_VERSION = "1.0.0"

# --------------------------------------------------------------------------
# Resampling / CV Configuration
# --------------------------------------------------------------------------
RANDOM_STATE = 42
TEST_SIZE = 0.20
N_CV_FOLDS = 5

# --------------------------------------------------------------------------
# Decision Threshold Tuning
# --------------------------------------------------------------------------
RECALL_FLOOR = 0.85

# Risk categories matched to diabetes definitions
RISK_BANDS = {
    "Low": (0.0, 0.33),
    "Moderate": (0.33, 0.66),
    "High": (0.66, 1.01),
}

# --------------------------------------------------------------------------
# Estimator Tuning Parameters
# --------------------------------------------------------------------------
PARAM_GRIDS = {
    "logistic_regression": {
        'classifier__C': [0.001, 0.01, 0.1, 1, 10, 100],
        'classifier__penalty': ['l1', 'l2'],
        'classifier__solver': ['liblinear']
    },
    "svm": {
        'classifier__C': [0.1, 1, 10, 100],
        'classifier__gamma': ['scale', 'auto', 0.001, 0.01, 0.1],
        'classifier__kernel': ['rbf', 'linear']
    },
    "random_forest": {
        'classifier__n_estimators': [50, 100, 200],
        'classifier__max_depth': [None, 5, 10, 15],
        'classifier__min_samples_split': [2, 5, 10],
        'classifier__min_samples_leaf': [1, 2, 4]
    },
    "gradient_boosting": {
        'classifier__n_estimators': [50, 100, 150],
        'classifier__learning_rate': [0.01, 0.05, 0.1],
        'classifier__max_depth': [3, 4, 5],
        'classifier__subsample': [0.8, 1.0]
    }
}

# --------------------------------------------------------------------------
# Explainability Configuration
# --------------------------------------------------------------------------
# Number of training rows to keep as a background summary for SHAP.
SHAP_BACKGROUND_SIZE = 100

# How many top contributing factors to return per explanation.
TOP_FACTORS = 5