"""Heart disease data loading, validation, and leakage-safe preprocessing.

Design rules enforced here:
  * Imputation and scaling/encoding are fit ONLY on training data via sklearn Pipelines
    and ColumnTransformer. The test set is only ever transformed.
  * Target column 'num' is binarized to 0 (Healthy) or 1 (Disease) during loading.
"""
from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path
from typing import Tuple

import numpy as np
import pandas as pd
from sklearn.compose import ColumnTransformer
from sklearn.impute import SimpleImputer
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler, OneHotEncoder

# Feature definitions
NUMERICAL_COLS = ["age", "trestbps", "chol", "thalach", "oldpeak"]
CATEGORICAL_COLS = ["sex", "cp", "fbs", "restecg", "exang", "slope", "ca", "thal"]
TARGET_NAME = "num"
ALL_COLUMNS = NUMERICAL_COLS + CATEGORICAL_COLS + [TARGET_NAME]

# Per-feature acceptable numeric ranges for schema validation.
FEATURE_RANGES = {
    "age": (0.0, 120.0),
    "sex": (0.0, 1.0),
    "cp": (1.0, 4.0),
    "trestbps": (0.0, 300.0),
    "chol": (0.0, 600.0),
    "fbs": (0.0, 1.0),
    "restecg": (0.0, 2.0),
    "thalach": (0.0, 250.0),
    "exang": (0.0, 1.0),
    "oldpeak": (0.0, 15.0),
    "slope": (1.0, 3.0),
    "ca": (0.0, 4.0),
    "thal": (3.0, 7.0),
}


class SchemaValidationError(ValueError):
    """Raised when the raw dataset does not match the expected schema."""


def load_raw_data(path: Path) -> pd.DataFrame:
    """Load the local heart disease CSV containing headers."""
    if not path.exists():
        raise FileNotFoundError(
            f"Heart disease dataset not found at {path}. "
            "Please ensure the CSV file is in the data folder."
        )
    df = pd.read_csv(path)
    return df


def validate_schema(df: pd.DataFrame) -> None:
    """Validate columns, types, target values, and feature ranges."""
    missing = [c for c in ALL_COLUMNS if c not in df.columns]
    if missing:
        raise SchemaValidationError(f"Missing expected columns: {missing}")

    extra = [c for c in df.columns if c not in ALL_COLUMNS]
    if extra:
        raise SchemaValidationError(f"Unexpected columns present: {extra}")

    if len(df) == 0:
        raise SchemaValidationError("Dataset contains no rows.")

    # Numeric check (ignoring NaNs, which are handled by imputer later)
    for col in ALL_COLUMNS:
        if not pd.api.types.is_numeric_dtype(df[col]):
            raise SchemaValidationError(f"Column '{col}' is not numeric.")

    # Target checks (before binarization we allow ranges or binary)
    unique_targets = set(df[TARGET_NAME].dropna().unique())
    # All values must be non-negative integers
    for val in unique_targets:
        if not float(val).is_integer() or val < 0:
            raise SchemaValidationError(
                f"Target '{TARGET_NAME}' must contain non-negative integers, found {unique_targets}"
            )

    # Feature range checks
    for col, (lo, hi) in FEATURE_RANGES.items():
        if col == TARGET_NAME or col not in df.columns:
            continue
        vals = df[col].dropna()
        if ((vals < lo) | (vals > hi)).any():
            raise SchemaValidationError(
                f"Column '{col}' contains values outside expected range [{lo}, {hi}]."
            )


def build_preprocessor() -> ColumnTransformer:
    """Build a reusable ColumnTransformer.

    Numerical features get median imputation and standard scaling.
    Categorical features get most_frequent imputation and one-hot encoding.
    """
    numerical_transformer = Pipeline(steps=[
        ('imputer', SimpleImputer(strategy='median')),
        ('scaler', StandardScaler())
    ])

    categorical_transformer = Pipeline(steps=[
        ('imputer', SimpleImputer(strategy='most_frequent')),
        ('onehot', OneHotEncoder(handle_unknown='ignore', sparse_output=False))
    ])

    return ColumnTransformer(transformers=[
        ('num', numerical_transformer, NUMERICAL_COLS),
        ('cat', categorical_transformer, CATEGORICAL_COLS)
    ], remainder="drop")


def build_model_pipeline(classifier) -> Pipeline:
    """Wrap a classifier in the full preprocessing->estimator pipeline."""
    return Pipeline(
        steps=[
            ("preprocessor", build_preprocessor()),
            ("classifier", classifier),
        ]
    )


@dataclass
class DatasetBundle:
    """Container for the train/test split and related metadata."""
    X_train: pd.DataFrame
    X_test: pd.DataFrame
    y_train: np.ndarray
    y_test: np.ndarray

    @property
    def n_train(self) -> int:
        return len(self.X_train)

    @property
    def n_test(self) -> int:
        return len(self.X_test)


def load_and_prepare(path: Path) -> Tuple[pd.DataFrame, pd.Series]:
    """Load, validate, and binarize the dataset. Returns (X, y_binary)."""
    raw = load_raw_data(path)
    validate_schema(raw)
    
    X = raw[NUMERICAL_COLS + CATEGORICAL_COLS].copy()
    y = (raw[TARGET_NAME] > 0).astype(int)
    
    return X, y


def make_stratified_split(
    X: pd.DataFrame,
    y: pd.Series,
    test_size: float = 0.20,
    random_state: int = 42,
) -> DatasetBundle:
    """Produce a stratified train/test split."""
    from sklearn.model_selection import train_test_split

    X_train, X_test, y_train, y_test = train_test_split(
        X,
        y.values,
        test_size=test_size,
        random_state=random_state,
        stratify=y.values,
    )
    
    # Keep dataframe structure for feature names mapping
    X_train_df = pd.DataFrame(X_train, columns=X.columns).reset_index(drop=True)
    X_test_df = pd.DataFrame(X_test, columns=X.columns).reset_index(drop=True)
    
    return DatasetBundle(
        X_train=X_train_df,
        X_test=X_test_df,
        y_train=y_train,
        y_test=y_test,
    )


if __name__ == "__main__":
    # Quick smoke check to ensure code executes without issues
    import sys
    sys.path.insert(0, str(Path(__file__).resolve().parent))
    from config import DATA_PATH
    try:
        X, y = load_and_prepare(DATA_PATH)
        bundle = make_stratified_split(X, y)
        print(f"Smoke test passed! Train size: {bundle.n_train}, Test size: {bundle.n_test}")
    except Exception as e:
        print(f"Smoke test failed: {e}")
