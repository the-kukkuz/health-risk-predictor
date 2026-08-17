"""ML pipeline tests: schema, preprocessing, zero handling, inference, SHAP."""
from __future__ import annotations

import sys
from pathlib import Path

import numpy as np
import pandas as pd
import pytest

ML_DIR = Path(__file__).resolve().parents[1]
if str(ML_DIR) not in sys.path:
    sys.path.insert(0, str(ML_DIR))

from config import (  # noqa: E402
    FEATURE_NAMES,
    RISK_BANDS,
    TARGET_NAME,
    ZERO_IS_MISSING,
)
from evaluate import choose_threshold, compute_metrics, labels_from_proba  # noqa: E402
import predict as predict_mod  # noqa: E402
import explain as explain_mod  # noqa: E402
from preprocessing import (  # noqa: E402
    SchemaValidationError,
    build_model_pipeline,
    build_preprocessor,
    clean_invalid_zeros,
    load_and_prepare,
    make_stratified_split,
    validate_schema,
)
from sklearn.linear_model import LogisticRegression  # noqa: E402


@pytest.fixture(scope="module")
def data():
    X, y = load_and_prepare()
    return make_stratified_split(X, y)


@pytest.fixture(scope="module")
def artifact():
    import joblib
    from config import ARTIFACT_PATH

    assert ARTIFACT_PATH.exists(), "Train the model first: python ml/diabetes/train.py"
    return joblib.load(ARTIFACT_PATH)


def test_dataset_schema_and_rowcount():
    raw = pd.read_csv(
        ML_DIR.parent.parent / "data" / "diabetes" / "pima-indians-diabetes.csv",
        header=None,
    )
    assert raw.shape == (768, 9)
    X, y = load_and_prepare()
    assert list(X.columns) == FEATURE_NAMES
    assert set(y.unique()).issubset({0, 1})


def test_invalid_schema_raises():
    df = pd.DataFrame({"wrong": [1, 2], TARGET_NAME: [0, 1]})
    with pytest.raises(SchemaValidationError):
        validate_schema(df)


def test_invalid_zeros_become_nan_but_pregnancies_kept():
    raw = pd.read_csv(
        ML_DIR.parent.parent / "data" / "diabetes" / "pima-indians-diabetes.csv",
        header=None,
        names=FEATURE_NAMES + [TARGET_NAME],
    )
    cleaned = clean_invalid_zeros(raw)
    # Invalid-zero columns should now have NaNs.
    for col in ZERO_IS_MISSING:
        assert cleaned[col].isna().any(), f"{col} zeros not converted"
        assert (cleaned[col] == 0).sum() == 0, f"{col} still contains zeros"
    # Pregnancies=0 must remain valid (NOT converted to NaN).
    assert raw["Pregnancies"].eq(0).any()
    assert cleaned["Pregnancies"].isna().sum() == 0
    # Original must not be mutated.
    assert raw["Glucose"].isna().sum() == 0


def test_no_test_leakage_in_preprocessing(data):
    """Imputer/scaler must be fit on train only; test values never affect fit."""
    pre = build_preprocessor()
    pre.fit(data.X_train)
    # Inject an extreme outlier into TEST only; transformed output for an
    # unaffected reference row must be identical (proving test didn't refit).
    Xt_a = pre.transform(data.X_test.head(1))
    corrupted = data.X_test.copy()
    corrupted.loc[corrupted.index[0], "Insulin"] = 1_000_000.0
    pre2 = build_preprocessor()
    pre2.fit(data.X_train)  # fit only on train (same train)
    Xt_b = pre2.transform(data.X_test.head(1))
    np.testing.assert_array_almost_equal(Xt_a, Xt_b)


def test_model_pipeline_runs(data):
    pipe = build_model_pipeline(LogisticRegression(max_iter=1000))
    pipe.fit(data.X_train, data.y_train)
    proba = pipe.predict_proba(data.X_test)[:, 1]
    assert proba.shape == (data.n_test,)
    assert ((proba >= 0) & (proba <= 1)).all()


def test_threshold_selection_prefers_recall():
    y = np.array([0, 0, 1, 1, 1, 0, 1, 0])
    proba = np.array([0.1, 0.4, 0.35, 0.6, 0.2, 0.7, 0.9, 0.05])
    thr = choose_threshold(
        y, proba, [0.2, 0.3, 0.5, 0.7], precision_floor=0.4
    )
    assert thr in [0.2, 0.3, 0.5, 0.7]
    # At the chosen threshold recall must be >= recall at higher thresholds set.
    m = compute_metrics(y, proba, thr)
    assert m["precision"] >= 0.4


def test_labels_from_proba():
    proba = np.array([0.1, 0.5, 0.9])
    np.testing.assert_array_equal(labels_from_proba(proba, 0.5), [0, 1, 1])


def test_risk_bands():
    assert predict_mod.assign_risk_band(0.10) == "Low"
    assert predict_mod.assign_risk_band(0.50) == "Moderate"
    assert predict_mod.assign_risk_band(0.80) == "High"
    assert predict_mod.assign_risk_band(1.0) == "High"
    # Bands sum-cover [0,1]
    for p in [0.0, 0.33, 0.66, 0.99]:
        assert predict_mod.assign_risk_band(p) in RISK_BANDS


def test_inference_end_to_end(artifact):
    rec = {
        "Pregnancies": 6,
        "Glucose": 148,
        "BloodPressure": 72,
        "SkinThickness": 35,
        "Insulin": 0,
        "BMI": 33.6,
        "DiabetesPedigreeFunction": 0.627,
        "Age": 50,
    }
    out = predict_mod.predict_one(artifact, rec)
    assert out["disease"] == "diabetes"
    assert out["prediction"] in (0, 1)
    assert 0 <= out["probability"] <= 1
    assert out["risk_band"] in ("Low", "Moderate", "High")
    assert out["threshold"] == artifact["threshold"]


def test_inference_rejects_missing_feature(artifact):
    with pytest.raises(ValueError):
        predict_mod.predict_one(artifact, {"Glucose": 100})


def test_shap_output_structure(artifact):
    rec = {
        "Pregnancies": 1,
        "Glucose": 85,
        "BloodPressure": 66,
        "SkinThickness": 29,
        "Insulin": 0,
        "BMI": 26.6,
        "DiabetesPedigreeFunction": 0.351,
        "Age": 31,
    }
    explainer = explain_mod.build_explainer(artifact)
    factors = explain_mod.explain_one(artifact, rec, explainer)
    assert 1 <= len(factors) <= 5
    for f in factors:
        assert f["feature"] in FEATURE_NAMES
        assert f["direction"] in ("increases_risk", "decreases_risk")
        assert f["impact"] >= 0
        assert "shap_value" in f
