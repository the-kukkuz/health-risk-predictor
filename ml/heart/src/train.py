"""Heart disease model training, comparison, tuning, and artifact serialization.

Pipeline
--------
1. Load + validate + binarize heart disease dataset.
2. Stratified train/test split (test set held out strictly).
3. For each of 4 model families, run a manual nested cross-validation loop:
     - Outer Loop: Generate unbiased out-of-fold predictions.
     - Inner Loop: Tune hyperparameters strictly on outer fold training data.
4. Select the optimal decision threshold from nested OOF probabilities.
5. Select the winning model family deterministically.
6. Verify quality gate: selected model + threshold must achieve Recall >= 0.85 on nested OOF.
7. Refit the selected model family on the entire training set using a final GridSearchCV.
8. Evaluate on the untouched test set as a one-time final verification.
9. Serialize the full inference pipeline (preprocessor + model) and metadata to a versioned directory.
"""
from __future__ import annotations

import json
import logging
import sys
import time
from pathlib import Path
from typing import Dict, Tuple, Any

import joblib
import sklearn
import numpy as np
import pandas as pd
from sklearn.ensemble import GradientBoostingClassifier, RandomForestClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.model_selection import GridSearchCV, StratifiedKFold
from sklearn.svm import SVC
from sklearn.metrics import roc_auc_score, accuracy_score, recall_score, precision_score, f1_score, confusion_matrix

# Insert the parent directory (src) to sys.path to allow sibling imports if run as a script.
sys.path.insert(0, str(Path(__file__).resolve().parent))

from config import (
    DATA_PATH,
    MODELS_DIR,
    MODEL_NAME,
    MODEL_VERSION,
    RANDOM_STATE,
    TEST_SIZE,
    N_CV_FOLDS,
    RECALL_FLOOR,
    RISK_BANDS,
    PARAM_GRIDS,
)
from evaluate import (
    choose_threshold_for_model,
    compute_metrics,
    confusion_matrix_as_dict,
)
from preprocessing import (
    NUMERICAL_COLS,
    CATEGORICAL_COLS,
    load_and_prepare,
    make_stratified_split,
    build_model_pipeline,
    DatasetBundle,
)

# Set up logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
    handlers=[logging.StreamHandler(sys.stdout)]
)
logger = logging.getLogger("heart_pipeline")


def _build_base_estimators() -> Dict[str, Any]:
    """Construct untuned classifier instances for each model family."""
    return {
        "logistic_regression": LogisticRegression(max_iter=1000, random_state=RANDOM_STATE),
        "svm": SVC(probability=True, random_state=RANDOM_STATE),
        "random_forest": RandomForestClassifier(random_state=RANDOM_STATE),
        "gradient_boosting": GradientBoostingClassifier(random_state=RANDOM_STATE),
    }


def _clean_params(params: dict) -> dict:
    """Ensure dictionary values from scikit-learn are JSON serializable."""
    clean = {}
    for k, v in params.items():
        clean[k] = v.item() if hasattr(v, "item") else v
    return clean


def _nested_oof_proba(
    estimator: Any,
    param_grid: dict,
    X_train: pd.DataFrame,
    y_train: np.ndarray,
    cv_strategy: StratifiedKFold
) -> np.ndarray:
    """Perform explicit nested cross-validation to generate out-of-fold probabilities.
    
    For each outer fold:
      1. Split training data into outer training and outer validation folds.
      2. Run GridSearchCV strictly on the outer training fold to tune hyperparameters.
      3. Predict positive class probabilities on the outer validation fold using the refitted best estimator.
    """
    oof_proba = np.zeros(len(X_train))
    
    for fold, (train_idx, val_idx) in enumerate(cv_strategy.split(X_train, y_train)):
        X_outer_train, X_outer_val = X_train.iloc[train_idx], X_train.iloc[val_idx]
        y_outer_train = y_train[train_idx]
        
        # Inner CV strategy for hyperparameter tuning
        inner_cv = StratifiedKFold(n_splits=cv_strategy.n_splits, shuffle=True, random_state=cv_strategy.random_state)
        
        grid_search = GridSearchCV(
            estimator=estimator,
            param_grid=param_grid,
            cv=inner_cv,
            scoring='roc_auc',
            n_jobs=-1,
            refit=True
        )
        grid_search.fit(X_outer_train, y_outer_train)
        
        # Predict on outer validation fold using the refitted best estimator
        oof_proba[val_idx] = grid_search.predict_proba(X_outer_val)[:, 1]
        logger.info(f"    Outer fold {fold + 1}/{cv_strategy.n_splits} complete. Best inner parameters: {grid_search.best_params_}")
        
    return oof_proba


def train_and_select(bundle: DatasetBundle) -> Dict[str, Any]:
    """Orchestrate nested CV across all candidate model families to select family and threshold."""
    base_estimators = _build_base_estimators()
    cv_strategy = StratifiedKFold(n_splits=N_CV_FOLDS, shuffle=True, random_state=RANDOM_STATE)
    
    family_results = {}
    
    logger.info("Starting nested cross-validation on training split...")
    
    for name, clf in base_estimators.items():
        logger.info(f"Running nested CV for: {name}")
        pipeline = build_model_pipeline(clf)
        
        # Generate unbiased OOF probabilities via manual loop nested CV
        oof_proba = _nested_oof_proba(
            pipeline, PARAM_GRIDS[name], bundle.X_train, bundle.y_train, cv_strategy
        )
        
        # Sweep thresholds and find the best one satisfying the recall floor
        optimal_threshold, selection_info = choose_threshold_for_model(
            bundle.y_train, oof_proba, recall_floor=RECALL_FLOOR
        )
        
        oof_auc = float(roc_auc_score(bundle.y_train, oof_proba))
        
        family_results[name] = {
            "model_family": name,
            "oof_proba": oof_proba,
            "oof_auc": oof_auc,
            "optimal_threshold": optimal_threshold,
            "meets_recall": selection_info["meets_recall"],
            "best_selection_metrics": selection_info["best_selection_metrics"],
            "scan_data": selection_info["scan_data"]
        }
        
        metrics = selection_info["best_selection_metrics"]
        logger.info(f"  {name} OOF Results: AUC={oof_auc:.4f}, Thr={optimal_threshold:.2f}, "
                    f"Recall={metrics['recall']:.4f}, Precision={metrics['precision']:.4f}")
        
    # Select winning model family strictly based on OOF metrics
    eligible_models = [res for res in family_results.values() if res["meets_recall"]]
    
    if not eligible_models:
        logger.warning(f"No model families met the Recall constraint of >= {RECALL_FLOOR} on nested OOF predictions.")
        # Fallback: Select by highest F1 score
        winning_res = max(
            family_results.values(),
            key=lambda r: (r["best_selection_metrics"]["f1"], r["best_selection_metrics"]["recall"])
        )
        selection_reason = f"Fallback: No model family met the recall floor. Selected by highest OOF F1."
    else:
        # Sort by precision (descending), then F1 (descending), then AUC-ROC (descending)
        winning_res = max(
            eligible_models,
            key=lambda r: (
                r["best_selection_metrics"]["precision"],
                r["best_selection_metrics"]["f1"],
                r["oof_auc"]
            )
        )
        selection_reason = f"Maximized OOF precision subject to Recall >= {RECALL_FLOOR} constraint."
        
    logger.info(f"Winning model family selected: {winning_res['model_family']}")
    logger.info(f"Locked threshold: {winning_res['optimal_threshold']:.2f}")
    logger.info(f"Selection reason: {selection_reason}")
    
    return {
        "winning_family": winning_res["model_family"],
        "winning_threshold": winning_res["optimal_threshold"],
        "family_results": family_results,
        "selection_reason": selection_reason
    }


def refit_final(family: str, X_train: pd.DataFrame, y_train: np.ndarray) -> Tuple[Any, dict]:
    """Perform final hyperparameter search on the complete training set, refitting the selected model."""
    clf = _build_base_estimators()[family]
    pipeline = build_model_pipeline(clf)
    
    cv_strategy = StratifiedKFold(n_splits=N_CV_FOLDS, shuffle=True, random_state=RANDOM_STATE)
    
    logger.info(f"Running final GridSearchCV on full training set for selected family: {family}")
    grid_search = GridSearchCV(
        estimator=pipeline,
        param_grid=PARAM_GRIDS[family],
        cv=cv_strategy,
        scoring='roc_auc',
        n_jobs=-1,
        refit=True
    )
    grid_search.fit(X_train, y_train)
    return grid_search.best_estimator_, grid_search.best_params_


def evaluate_on_test(
    pipeline: Any,
    threshold: float,
    bundle: DatasetBundle
) -> Dict[str, Any]:
    """Evaluate final model pipeline on the untouched test set (one-time final evaluation)."""
    probas = pipeline.predict_proba(bundle.X_test)[:, 1]
    
    metrics = compute_metrics(bundle.y_test, probas, threshold)
    preds = (probas >= threshold).astype(int)
    metrics["confusion_matrix"] = confusion_matrix_as_dict(bundle.y_test, preds)
    
    return metrics


def build_artifact(
    final_pipeline: Any,
    family: str,
    threshold: float,
    best_params: dict
) -> Dict[str, Any]:
    """Assemble final production model artifact for inference layer serving (SHAP removed)."""
    classifier = final_pipeline.named_steps["classifier"]
    
    return {
        "pipeline": final_pipeline,
        "classifier_class": classifier.__class__.__name__,
        "family": family,
        "feature_names": NUMERICAL_COLS + CATEGORICAL_COLS,
        "threshold": float(threshold),
        "best_params": _clean_params(best_params),
        "risk_bands": RISK_BANDS,
        "model_name": MODEL_NAME,
        "model_version": MODEL_VERSION
    }


def build_metadata(
    artifact: Dict[str, Any],
    selection: Dict[str, Any],
    test_metrics: Dict[str, Any],
    bundle: DatasetBundle
) -> Dict[str, Any]:
    """Assemble final structural metadata document for integration contract."""
    family_results = selection["family_results"]
    selected_family = selection["winning_family"]
    
    validation_metrics = {}
    for name, res in family_results.items():
        metrics = res["best_selection_metrics"]
        validation_metrics[name] = {
            "threshold": float(res["optimal_threshold"]),
            "accuracy": round(float(metrics["accuracy"]), 4),
            "precision": round(float(metrics["precision"]), 4),
            "recall": round(float(metrics["recall"]), 4),
            "f1": round(float(metrics["f1"]), 4),
            "roc_auc": round(float(res["oof_auc"]), 4)
        }
        
    scan_info = []
    for item in family_results[selected_family]["scan_data"]:
        scan_info.append({
            "threshold": float(item["threshold"]),
            "accuracy": round(float(item["accuracy"]), 4),
            "precision": round(float(item["precision"]), 4),
            "recall": round(float(item["recall"]), 4),
            "f1": round(float(item["f1"]), 4),
            "roc_auc": round(float(family_results[selected_family]["oof_auc"]), 4)
        })
        
    return {
        "model_name": artifact["model_name"],
        "model_version": artifact["model_version"],
        "selected_family": selected_family,
        "classifier_class": artifact["classifier_class"],
        "best_params": artifact["best_params"],
        "feature_names": artifact["feature_names"],
        "training_date": time.strftime("%Y-%m-%d %H:%M:%S"),
        "python_version": sys.version,
        "sklearn_version": sklearn.__version__,
        "random_state": RANDOM_STATE,
        "cv_folds": N_CV_FOLDS,
        "test_size": TEST_SIZE,
        "threshold": artifact["threshold"],
        "threshold_selection": {
            "method": "nested_cross_validated_training_predictions",
            "recall_floor": RECALL_FLOOR,
            "candidate_thresholds": [round(float(t), 2) for t in np.linspace(0.05, 0.95, 91)],
            "reason": selection["selection_reason"],
            "scan_for_selected_family": scan_info
        },
        "validation_metrics_oof": validation_metrics,
        "test_metrics": test_metrics,
        "risk_bands": {
            label: list(bounds) for label, bounds in RISK_BANDS.items()
        },
        "n_train": int(bundle.n_train),
        "n_test": int(bundle.n_test),
        "disclaimer": (
            "This system provides machine-learning-based risk stratification "
            "for research and decision-support purposes. It is not a medical "
            "diagnostic tool and should not be used as a substitute for "
            "professional medical evaluation."
        )
    }


def main() -> None:
    # Set up versioned models folder
    version_dir = MODELS_DIR / f"v{MODEL_VERSION}"
    version_dir.mkdir(parents=True, exist_ok=True)
    
    artifact_path = version_dir / "heart_model.joblib"
    metadata_path = version_dir / "metadata.json"
    
    logger.info("=== HEART DISEASE ML TRAINING PIPELINE ===")
    logger.info(f"Model version: {MODEL_VERSION}")
    logger.info(f"Dataset path: {DATA_PATH}")
    
    # 1. Load data
    X, y = load_and_prepare(DATA_PATH)
    
    # 2. Stratified train/test split
    bundle = make_stratified_split(X, y, test_size=TEST_SIZE, random_state=RANDOM_STATE)
    logger.info(f"Data Split Completed -> Train size: {bundle.n_train} | Test size: {bundle.n_test}")
    
    # 3. Nested cross-validation and family/threshold selection
    selection = train_and_select(bundle)
    
    winning_family = selection["winning_family"]
    winning_threshold = selection["winning_threshold"]
    winning_results = selection["family_results"][winning_family]
    oof_metrics = winning_results["best_selection_metrics"]
    
    # 4. Model Quality Gate
    logger.info("Executing model quality gate checks...")
    oof_recall = oof_metrics["recall"]
    logger.info(f"  Selected Model OOF Recall: {oof_recall:.4f} (Required Floor: {RECALL_FLOOR})")
    
    if oof_recall < RECALL_FLOOR:
        error_msg = (
            f"Quality Gate Failed: Selected model + threshold achieved OOF Recall of {oof_recall:.4f}, "
            f"which is below the required clinical safety floor of {RECALL_FLOOR}."
        )
        logger.error(error_msg)
        raise RuntimeError(error_msg)
        
    logger.info("  Quality Gate Passed: Selected model recall meets the required safety floor.")
    
    # 5. Final refit on entire training set
    final_pipeline, best_params = refit_final(winning_family, bundle.X_train, bundle.y_train)
    logger.info(f"Final model hyperparameter refit complete. Parameters: {best_params}")
    
    # 6. Evaluation on untouched test set
    logger.info("Running final evaluation on held-out test set...")
    test_metrics = evaluate_on_test(final_pipeline, winning_threshold, bundle)
    
    logger.info("=== Final Evaluation Metrics ===")
    for k, v in test_metrics.items():
        if k != "confusion_matrix":
            logger.info(f"  {k:15}: {v}")
    logger.info(f"  Confusion Matrix: {test_metrics['confusion_matrix']}")
    
    # 7. Package and save versioned artifact
    artifact = build_artifact(final_pipeline, winning_family, winning_threshold, best_params)
    metadata = build_metadata(artifact, selection, test_metrics, bundle)
    
    joblib.dump(artifact, artifact_path)
    with open(metadata_path, "w") as f:
        json.dump(metadata, f, indent=2)
        
    logger.info(f"Production model artifact successfully saved to: {artifact_path}")
    logger.info(f"Production metadata JSON successfully saved to: {metadata_path}")


if __name__ == "__main__":
    main()
