"""Tests for SHAP explainability in the heart module."""
from __future__ import annotations

import sys
from pathlib import Path

import numpy as np
import pytest

# Add project root to path for runtime execution
sys.path.insert(0, str(Path(__file__).resolve().parents[3]))

from ml.heart.src.explain import _extract_shap_values, explain_one, validate_inputs


def test_validate_inputs():
    """Test that input validation converts to dataframe correctly and catches missing fields."""
    record = {
        "age": 45, "trestbps": 120, "chol": 230, "thalach": 150, "oldpeak": 0.5,
        "sex": 1, "cp": 3, "fbs": 0, "restecg": 1, "exang": 0, "slope": 2, "ca": 0, "thal": 3
    }
    df = validate_inputs(record)
    assert df.shape == (1, 13)
    
    # Check ordered extraction
    assert list(df.columns) == ["age", "trestbps", "chol", "thalach", "oldpeak", "sex", "cp", "fbs", "restecg", "exang", "slope", "ca", "thal"]
    
    # Missing key
    del record["age"]
    with pytest.raises(ValueError, match="Missing expected input features"):
        validate_inputs(record)


# Mocking a basic explainer structure for testing _extract_shap_values
class MockShapValues:
    def __init__(self, values):
        self.values = values

def test_extract_shap_values():
    """Test standardizing SHAP array shape regardless of explainer algorithm."""
    # 1D output (e.g., TreeExplainer binary)
    out_1d = MockShapValues(np.array([0.1, -0.2, 0.3]))
    assert np.array_equal(_extract_shap_values(out_1d), [0.1, -0.2, 0.3])
    
    # 2D (samples, features) from some explainers when sample=1
    out_2d = MockShapValues(np.array([[0.1, -0.2, 0.3]]))
    assert np.array_equal(_extract_shap_values(out_2d), [0.1, -0.2, 0.3])

    # 2D (features, classes) e.g. RandomForest with 2 classes
    out_2d_classes = MockShapValues(np.array([[0.1, -0.1], [0.2, -0.2], [0.3, -0.3]]))
    # The current extraction grabs arr[:, 1]
    assert np.array_equal(_extract_shap_values(out_2d_classes), [-0.1, -0.2, -0.3])


class MockExplainer:
    def __call__(self, X_trans):
        return MockShapValues(np.array([0.5, -0.2, 0.1, -0.8, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0]))


class MockPreprocessor:
    def transform(self, X):
        return np.ones((1, 13))


def test_explain_one():
    """Test the end-to-end explain_one function logic."""
    artifact = {
        "preprocessor": MockPreprocessor(),
        "feature_names": ["age", "trestbps", "chol", "thalach", "oldpeak", "sex", "cp", "fbs", "restecg", "exang", "slope", "ca", "thal"]
    }
    record = {
        "age": 45, "trestbps": 120, "chol": 230, "thalach": 150, "oldpeak": 0.5,
        "sex": 1, "cp": 3, "fbs": 0, "restecg": 1, "exang": 0, "slope": 2, "ca": 0, "thal": 3
    }
    
    factors = explain_one(artifact, record, explainer=MockExplainer(), top_n=3)
    
    assert len(factors) == 3
    
    # The highest absolute magnitude is -0.8 (index 3 -> thalach)
    assert factors[0]["feature"] == "thalach"
    assert factors[0]["impact"] == 0.8
    assert factors[0]["direction"] == "decreases_risk"
    
    # Next highest is 0.5 (index 0 -> age)
    assert factors[1]["feature"] == "age"
    assert factors[1]["impact"] == 0.5
    assert factors[1]["direction"] == "increases_risk"
    
    # Next highest is -0.2 (index 1 -> trestbps)
    assert factors[2]["feature"] == "trestbps"
    assert factors[2]["impact"] == 0.2
    assert factors[2]["direction"] == "decreases_risk"
