"""Diabetes data loading, validation, and leakage-safe preprocessing.

Design rules enforced here:
  * Invalid zeros (Glucose, BloodPressure, SkinThickness, Insulin, BMI) are
    converted to NaN BEFORE the train/test split.
  * Imputation and scaling are fit ONLY on training data via sklearn Pipelines
    and ColumnTransformer. The test set is only ever transformed.
  * Pregnancies=0 is a valid value and is never treated as missing.
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
from sklearn.preprocessing import StandardScaler

from config import (
    ALL_COLUMNS,
    DATA_PATH,
    FEATURE_NAMES,
    FEATURE_RANGES,
    TARGET_NAME,
    ZERO_IS_MISSING,
)


class SchemaValidationError(ValueError):
    """Raised when the raw dataset does not match the expected schema."""


def load_raw_data(path: Path = DATA_PATH) -> pd.DataFrame:
    """Load the headerless UCI CSV and attach the canonical column names."""
    if not path.exists():
        raise FileNotFoundError(
            f"Diabetes dataset not found at {path}. "
            "Place the UCI Pima Indians CSV at that path."
        )
    df = pd.read_csv(path, header=None, names=ALL_COLUMNS)
    return df


def validate_schema(df: pd.DataFrame) -> None:
    """Validate columns, types, target values, and per-feature value ranges."""
    missing = [c for c in ALL_COLUMNS if c not in df.columns]
    if missing:
        raise SchemaValidationError(f"Missing expected columns: {missing}")

    extra = [c for c in df.columns if c not in ALL_COLUMNS]
    if extra:
        raise SchemaValidationError(f"Unexpected columns present: {extra}")

    if len(df) == 0:
        raise SchemaValidationError("Dataset contains no rows.")

    # Numeric coercion check
    for col in ALL_COLUMNS:
        if not pd.api.types.is_numeric_dtype(df[col]):
            raise SchemaValidationError(f"Column '{col}' is not numeric.")

    # Target must be binary 0/1
    unique_targets = set(df[TARGET_NAME].dropna().unique())
    if not unique_targets.issubset({0, 1}):
        raise SchemaValidationError(
            f"Target '{TARGET_NAME}' must contain only 0/1, found {unique_targets}"
        )

    # Range sanity check (NaN allowed after zero->NaN, but present values must be
    # non-negative and within documented bounds).
    for col, (lo, hi) in FEATURE_RANGES.items():
        vals = df[col].dropna()
        if (vals < lo).any() or (vals > hi).any():
            bad = int(((vals < lo) | (vals > hi)).sum())
            raise SchemaValidationError(
                f"Column '{col}' has {bad} value(s) outside [{lo}, {hi}]."
            )


def clean_invalid_zeros(df: pd.DataFrame) -> pd.DataFrame:
    """Replace clinically implausible zeros with NaN.

    Operates on a copy; never mutates the input frame.
    Pregnancies is explicitly excluded (0 pregnancies is valid).
    """
    out = df.copy()
    for col in ZERO_IS_MISSING:
        out.loc[out[col] == 0, col] = np.nan
    return out


def build_preprocessor() -> ColumnTransformer:
    """Build a reusable ColumnTransformer.

    All 8 features are numeric; each gets median imputation followed by
    standard scaling. Median imputation is robust to the skewed insulin /
    skin-thickness distributions. The fitted object is the ONLY thing that
    learns preprocessing parameters, and it is fit on training data only.
    """
    numeric_pipeline = Pipeline(
        steps=[
            ("imputer", SimpleImputer(strategy="median")),
            ("scaler", StandardScaler()),
        ]
    )
    return ColumnTransformer(
        transformers=[("num", numeric_pipeline, FEATURE_NAMES)],
        remainder="drop",
    )


def build_model_pipeline(classifier) -> Pipeline:
    """Wrap a classifier in the full preprocessing->estimator pipeline."""
    return Pipeline(
        steps=[
            ("preprocessor", build_preprocessor()),
            ("clf", classifier),
        ]
    )


@dataclass
class DatasetBundle:
    """Container for the train/test split and related metadata."""

    X_train: pd.DataFrame
    X_test: pd.DataFrame
    y_train: pd.Series
    y_test: pd.Series

    @property
    def n_train(self) -> int:
        return len(self.X_train)

    @property
    def n_test(self) -> int:
        return len(self.X_test)


def load_and_prepare(
    test_size: float = 0.20, random_state: int = 42
) -> Tuple[pd.DataFrame, pd.Series]:
    """Load, validate, and clean the raw dataset. Returns (X, y) pre-split."""
    from sklearn.model_selection import train_test_split

    raw = load_raw_data()
    validate_schema(raw)
    cleaned = clean_invalid_zeros(raw)
    X = cleaned[FEATURE_NAMES]
    y = cleaned[TARGET_NAME].astype(int)
    return X, y


def make_stratified_split(
    X: pd.DataFrame,
    y: pd.Series,
    test_size: float = 0.20,
    random_state: int = 42,
) -> DatasetBundle:
    """Produce a stratified train/test split (test set is held out untouched)."""
    from sklearn.model_selection import train_test_split

    X_train, X_test, y_train, y_test = train_test_split(
        X,
        y,
        test_size=test_size,
        random_state=random_state,
        stratify=y,
    )
    return DatasetBundle(
        X_train=X_train.reset_index(drop=True),
        X_test=X_test.reset_index(drop=True),
        y_train=y_train.reset_index(drop=True),
        y_test=y_test.reset_index(drop=True),
    )


if __name__ == "__main__":
    # Quick smoke check
    X, y = load_and_prepare()
    bundle = make_stratified_split(X, y)
    print(f"Train: {bundle.n_train}  Test: {bundle.n_test}")
    print(f"Train positive rate: {bundle.y_train.mean():.3f}")
    print(f"Test positive rate:  {bundle.y_test.mean():.3f}")
    pre = build_preprocessor()
    pre.fit(bundle.X_train)
    print("Preprocessor fitted OK on training data only.")
