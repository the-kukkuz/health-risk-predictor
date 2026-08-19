"""Tests for data validation, binarization, and schema integrity."""
from __future__ import annotations

import sys
from pathlib import Path
import numpy as np
import pandas as pd
import pytest

# Add src to the path
sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "src"))

from preprocessing import (
    NUMERICAL_COLS,
    CATEGORICAL_COLS,
    TARGET_NAME,
    validate_schema,
    load_and_prepare,
    SchemaValidationError,
)


@pytest.fixture
def dummy_valid_df() -> pd.DataFrame:
    """Create a minimum valid dataframe matching the schema."""
    data = {}
    for col in NUMERICAL_COLS:
        data[col] = [45.0, 50.0, 60.0]
    for col in CATEGORICAL_COLS:
        data[col] = [1.0, 0.0, 1.0]
    data[TARGET_NAME] = [0.0, 2.0, 1.0]  # Raw multi-class target
    return pd.DataFrame(data)


def test_validate_schema_valid(dummy_valid_df):
    """Verify that a schema-conforming DataFrame raises no errors."""
    # Should not raise any exception
    validate_schema(dummy_valid_df)


def test_validate_schema_missing_column(dummy_valid_df):
    """Verify that missing expected columns triggers a SchemaValidationError."""
    df_missing = dummy_valid_df.drop(columns=["age"])
    with pytest.raises(SchemaValidationError, match="Missing expected columns"):
        validate_schema(df_missing)


def test_validate_schema_unexpected_column(dummy_valid_df):
    """Verify that extra columns are rejected."""
    df_extra = dummy_valid_df.copy()
    df_extra["extra_col"] = [1.0, 2.0, 3.0]
    with pytest.raises(SchemaValidationError, match="Unexpected columns present"):
        validate_schema(df_extra)


def test_validate_schema_non_numeric(dummy_valid_df):
    """Verify that non-numeric types trigger a validation error."""
    df_string = dummy_valid_df.copy()
    df_string["age"] = ["young", "middle", "old"]
    with pytest.raises(SchemaValidationError, match="is not numeric"):
        validate_schema(df_string)


def test_validate_schema_invalid_target(dummy_valid_df):
    """Verify that negative or non-integer target values are rejected."""
    df_bad_target = dummy_valid_df.copy()
    df_bad_target[TARGET_NAME] = [0.0, -1.0, 2.5]
    with pytest.raises(SchemaValidationError, match="Target .* must contain non-negative integers"):
        validate_schema(df_bad_target)


def test_target_binarization(tmp_path, dummy_valid_df):
    """Verify load_and_prepare correctly maps multi-class labels to binary {0, 1}."""
    csv_file = tmp_path / "heart_disease.csv"
    dummy_valid_df.to_csv(csv_file, index=False)
    
    X, y = load_and_prepare(csv_file)
    
    # Assert features are isolated from target
    assert TARGET_NAME not in X.columns
    assert len(X.columns) == len(NUMERICAL_COLS) + len(CATEGORICAL_COLS)
    
    # Assert target is binarized (0 mapped to 0; 1 and 2 mapped to 1)
    np.testing.assert_array_equal(y.values, [0, 1, 1])
