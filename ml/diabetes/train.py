"""Diabetes model training, comparison, tuning, and artifact serialization.

Pipeline
--------
1. Load + validate + clean (invalid zeros -> NaN).
2. Stratified held-out test split (touched ONCE at the very end).
3. For each of 4 model families, run NESTED cross-validation:
     - outer 5-fold CV produces out-of-fold predicted probabilities
     - an inner GridSearchCV (small, recall-oriented) tunes hyper-parameters
       within each outer fold on training folds ONLY.
4. Select the decision threshold from OOF probabilities (test set never used).
5. Pick the best family by OOF recall (with a precision floor).
6. Refit the chosen family on the FULL training set via a final GridSearchCV.
7. Evaluate ONCE on the untouched test set and report honest metrics.
8. Save a complete inference artifact + metadata JSON.

Run:  python ml/diabetes/train.py   (from the repo root)
   or  python train.py               (from inside ml/diabetes)
"""
from __future__ import annotations

import json
import sys
import time
from pathlib import Path
from typing import Callable, Dict, List, Tuple

import numpy as np
import pandas as pd
from sklearn.ensemble import GradientBoostingClassifier, RandomForestClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.model_selection import GridSearchCV, cross_val_predict
from sklearn.svm import SVC

# Make sibling modules importable regardless of CWD.
sys.path.insert(0, str(Path(__file__).resolve().parent))

from config import (  # noqa: E402
    ARTIFACT_PATH,
    CANDIDATE_THRESHOLDS,
    CV_FOLDS,
    FEATURE_NAMES,
    METADATA_PATH,
    MODEL_NAME,
    MODEL_VERSION,
    MODELS_DIR,
    PARAM_GRIDS,
    INFERENCE_SPEED_RANK,
    RANDOM_STATE,
    RECALL_TIE_DELTA,
    RISK_BANDS,
    SHAP_BACKGROUND_SIZE,
    TEST_SIZE,
    THRESHOLD_PRECISION_FLOOR,
    TOP_FACTORS,
)
from evaluate import (  # noqa: E402
    choose_threshold,
    compute_metrics,
    confusion_matrix_as_dict,
    labels_from_proba,
    scan_thresholds,
)
from preprocessing import (  # noqa: E402
    build_model_pipeline,
    load_and_prepare,
    make_stratified_split,
)


def _build_base_estimators() -> Dict[str, object]:
    """Construct fresh, untuned classifier instances for each family."""
    return {
        "logistic_regression": LogisticRegression(
            max_iter=2000, random_state=RANDOM_STATE, solver="lbfgs"
        ),
        "svm": SVC(random_state=RANDOM_STATE, probability=True),
        "random_forest": RandomForestClassifier(random_state=RANDOM_STATE, n_jobs=1),
        "gradient_boosting": GradientBoostingClassifier(random_state=RANDOM_STATE),
    }


def _nested_oof_proba(
    estimator,
    param_grid: dict,
    X_train: pd.DataFrame,
    y_train: pd.Series,
) -> Tuple[np.ndarray, dict]:
    """Return out-of-fold positive-class probabilities via nested CV.

    Inner GridSearchCV tunes on training folds; outer CV yields unbiased OOF
    probabilities used solely for threshold selection and family comparison.
    The test set is never involved.
    """
    inner = GridSearchCV(
        estimator=estimator,
        param_grid=param_grid,
        cv=CV_FOLDS,
        scoring="recall",
        n_jobs=1,  # sequential inside; parallelism comes from the outer loop
        refit=True,
    )
    # Parallelize the outer folds. Each worker runs an independent inner search.
    oof = cross_val_predict(
        estimator=inner,
        X=X_train,
        y=y_train,
        cv=CV_FOLDS,
        method="predict_proba",
        n_jobs=-1,
    )
    return oof[:, 1], {}


def train_and_select(bundle) -> Dict:
    """Run nested CV for all families, select threshold + best family."""
    base_estimators = _build_base_estimators()
    family_results: Dict[str, Dict] = {}

    print("\n=== Nested cross-validation (training data only) ===")
    for name, clf in base_estimators.items():
        t0 = time.time()
        pipeline = build_model_pipeline(clf)
        oof_proba, _ = _nested_oof_proba(
            pipeline, PARAM_GRIDS[name], bundle.X_train, bundle.y_train
        )
        threshold = choose_threshold(
            bundle.y_train,
            oof_proba,
            CANDIDATE_THRESHOLDS,
            precision_floor=THRESHOLD_PRECISION_FLOOR,
        )
        oof_metrics = compute_metrics(bundle.y_train, oof_proba, threshold)
        family_results[name] = {
            "threshold": threshold,
            "oof_metrics": oof_metrics,
            "oof_proba": oof_proba,
        }
        elapsed = time.time() - t0
        print(
            f"  {name:22s}  recall={oof_metrics['recall']:.3f}  "
            f"precision={oof_metrics['precision']:.3f}  f1={oof_metrics['f1']:.3f}  "
            f"roc_auc={oof_metrics['roc_auc']:.3f}  thr={threshold:.2f}  "
            f"({elapsed:.1f}s)"
        )

    # ---- Select best family: maximize recall subject to precision floor. ----
    # Among models whose recall is within RECALL_TIE_DELTA of the best, prefer
    # the one with higher inference/SHAP speed (tree/linear > SVM), then F1.
    eligible = [
        (name, res)
        for name, res in family_results.items()
        if res["oof_metrics"]["precision"] >= THRESHOLD_PRECISION_FLOOR
    ]
    if eligible:
        best_recall = max(r["oof_metrics"]["recall"] for _, r in eligible)
        near_top = [
            (n, r)
            for n, r in eligible
            if best_recall - r["oof_metrics"]["recall"] <= RECALL_TIE_DELTA
        ]
        best_name, best_res = max(
            near_top,
            key=lambda kv: (
                INFERENCE_SPEED_RANK.get(kv[0], 0),
                kv[1]["oof_metrics"]["f1"],
            ),
        )
        selection_reason = (
            "highest/near-highest OOF recall (within "
            f"{RECALL_TIE_DELTA:.2f}) with precision >= floor; "
            "tree/linear model preferred for fast SHAP inference"
        )
    else:
        best_name, best_res = max(
            family_results.items(),
            key=lambda kv: (kv[1]["oof_metrics"]["f1"], kv[1]["oof_metrics"]["recall"]),
        )
        selection_reason = "no family met precision floor; selected by highest OOF F1"

    print(f"\n  -> Selected family: {best_name} ({selection_reason})")
    print(f"  -> Selected threshold: {best_res['threshold']:.2f}")

    return {
        "family_results": family_results,
        "selected_family": best_name,
        "selected_threshold": best_res["threshold"],
        "selection_reason": selection_reason,
    }


def refit_final(
    family: str, X_train: pd.DataFrame, y_train: pd.Series
):
    """Refit the chosen family on ALL training data using a final GridSearchCV."""
    clf = _build_base_estimators()[family]
    pipeline = build_model_pipeline(clf)
    grid = GridSearchCV(
        estimator=pipeline,
        param_grid=PARAM_GRIDS[family],
        cv=CV_FOLDS,
        scoring="recall",
        n_jobs=-1,
        refit=True,
    )
    grid.fit(X_train, y_train)
    return grid.best_estimator_, grid.best_params_


def evaluate_on_test(final_pipeline, threshold: float, bundle) -> Dict:
    """Evaluate the final model ONCE on the untouched test set."""
    proba = final_pipeline.predict_proba(bundle.X_test)[:, 1]
    metrics = compute_metrics(bundle.y_test, proba, threshold)
    y_pred = labels_from_proba(proba, threshold)
    cm = confusion_matrix_as_dict(bundle.y_test, y_pred)
    metrics["confusion_matrix"] = cm
    return metrics, proba


def build_artifact(
    final_pipeline,
    bundle,
    family: str,
    threshold: float,
    best_params: dict,
    selection: Dict,
) -> Dict:
    """Assemble the serializable inference artifact (everything for inference)."""
    preprocessor = final_pipeline.named_steps["preprocessor"]
    classifier = final_pipeline.named_steps["clf"]

    # Small transformed background sample for (re)building SHAP explainers.
    rng = np.random.default_rng(RANDOM_STATE)
    n_bg = min(SHAP_BACKGROUND_SIZE, len(bundle.X_train))
    bg_idx = rng.choice(len(bundle.X_train), size=n_bg, replace=False)
    X_background_transformed = preprocessor.transform(
        bundle.X_train.iloc[bg_idx]
    ).astype(float)

    return {
        "pipeline": final_pipeline,
        "preprocessor": preprocessor,
        "classifier": classifier,
        "classifier_class": classifier.__class__.__name__,
        "family": family,
        "feature_names": list(FEATURE_NAMES),
        "threshold": float(threshold),
        "best_params": _clean_params(best_params),
        "risk_bands": RISK_BANDS,
        "X_background": X_background_transformed,
        "model_name": MODEL_NAME,
        "model_version": MODEL_VERSION,
    }


def _clean_params(params: dict) -> dict:
    """Make GridSearchCV best_params_ JSON serializable."""
    clean = {}
    for k, v in params.items():
        clean[k] = v.item() if hasattr(v, "item") else v
    return clean


def build_metadata(
    artifact: Dict,
    selection: Dict,
    test_metrics: Dict,
    bundle,
) -> Dict:
    """Assemble the human-readable metadata JSON."""
    family_results = selection["family_results"]
    validation_metrics = {
        name: res["oof_metrics"] for name, res in family_results.items()
    }
    threshold_scan = scan_thresholds(
        bundle.y_train,
        family_results[selection["selected_family"]]["oof_proba"],
        CANDIDATE_THRESHOLDS,
    )
    return {
        "model_name": artifact["model_name"],
        "model_version": artifact["model_version"],
        "selected_family": selection["selected_family"],
        "classifier_class": artifact["classifier_class"],
        "best_params": artifact["best_params"],
        "feature_names": artifact["feature_names"],
        "training_date": time.strftime("%Y-%m-%d %H:%M:%S"),
        "random_state": RANDOM_STATE,
        "cv_folds": CV_FOLDS,
        "test_size": TEST_SIZE,
        "threshold": artifact["threshold"],
        "threshold_selection": {
            "method": "nested_cross_validated_training_predictions",
            "precision_floor": THRESHOLD_PRECISION_FLOOR,
            "candidate_thresholds": CANDIDATE_THRESHOLDS,
            "reason": selection["selection_reason"],
            "scan_for_selected_family": threshold_scan,
        },
        "validation_metrics_ooof": validation_metrics,
        "test_metrics": test_metrics,
        "risk_bands": {
            label: list(bounds) for label, bounds in RISK_BANDS.items()
        },
        "shap_top_factors": TOP_FACTORS,
        "n_train": int(bundle.n_train),
        "n_test": int(bundle.n_test),
        "disclaimer": (
            "This system provides machine-learning-based risk stratification "
            "for research and decision-support purposes. It is not a medical "
            "diagnostic tool and should not be used as a substitute for "
            "professional medical evaluation."
        ),
    }


def main() -> None:
    MODELS_DIR.mkdir(parents=True, exist_ok=True)

    print("Loading and preparing data...")
    X, y = load_and_prepare(test_size=TEST_SIZE, random_state=RANDOM_STATE)
    bundle = make_stratified_split(
        X, y, test_size=TEST_SIZE, random_state=RANDOM_STATE
    )
    print(
        f"  train={bundle.n_train} (pos rate={bundle.y_train.mean():.3f})  "
        f"test={bundle.n_test} (pos rate={bundle.y_test.mean():.3f})"
    )

    selection = train_and_select(bundle)

    print("\nRefitting selected model on full training set...")
    t0 = time.time()
    final_pipeline, best_params = refit_final(
        selection["selected_family"], bundle.X_train, bundle.y_train
    )
    print(f"  refit done in {time.time() - t0:.1f}s")
    print(f"  best params: {best_params}")

    print("\n=== FINAL evaluation on UNTOUCHED test set (one-time) ===")
    test_metrics, _ = evaluate_on_test(
        final_pipeline, selection["selected_threshold"], bundle
    )
    for k, v in test_metrics.items():
        if k != "confusion_matrix":
            print(f"  {k:12s}: {v}")
    print(f"  confusion   : {test_metrics['confusion_matrix']}")
    print(
        f"\n  Target recall >= 0.85: "
        f"{'ACHIEVED' if test_metrics['recall'] >= 0.85 else 'NOT achieved'} "
        f"(actual test recall = {test_metrics['recall']:.3f}). "
        "The target is aspirational and is never guaranteed."
    )

    artifact = build_artifact(
        final_pipeline,
        bundle,
        selection["selected_family"],
        selection["selected_threshold"],
        best_params,
        selection,
    )
    metadata = build_metadata(artifact, selection, test_metrics, bundle)

    import joblib

    joblib.dump(artifact, ARTIFACT_PATH)
    with open(METADATA_PATH, "w") as f:
        json.dump(metadata, f, indent=2)

    print(f"\nArtifact saved: {ARTIFACT_PATH}")
    print(f"Metadata saved: {METADATA_PATH}")


if __name__ == "__main__":
    main()
