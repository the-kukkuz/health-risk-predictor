"""Evaluation and threshold selection helpers for heart disease classification.

All metrics accept actual targets, predicted probabilities, and locked thresholds.
"""
from __future__ import annotations

from typing import Dict, List, Tuple, Iterable
import numpy as np
import pandas as pd
from sklearn.metrics import (
    accuracy_score,
    confusion_matrix,
    f1_score,
    precision_score,
    recall_score,
    roc_auc_score,
)


def compute_metrics(
    y_true: Iterable[int],
    proba: np.ndarray,
    threshold: float,
) -> Dict[str, float]:
    """Compute basic performance metrics for a classification model at a given threshold."""
    y_true = np.asarray(y_true).astype(int)
    proba = np.asarray(proba, dtype=float)
    y_pred = (proba >= threshold).astype(int)

    return {
        "threshold": round(float(threshold), 4),
        "accuracy": round(float(accuracy_score(y_true, y_pred)), 4),
        "precision": round(float(precision_score(y_true, y_pred, zero_division=0)), 4),
        "recall": round(float(recall_score(y_true, y_pred, zero_division=0)), 4),
        "f1": round(float(f1_score(y_true, y_pred, zero_division=0)), 4),
        "roc_auc": round(float(roc_auc_score(y_true, proba)), 4),
    }


def confusion_matrix_as_dict(y_true: Iterable[int], y_pred: Iterable[int]) -> Dict[str, int]:
    """Generate confusion matrix formatted as a dictionary for JSON serialization."""
    cm = confusion_matrix(y_true, y_pred, labels=[0, 1])
    tn, fp, fn, tp = cm.ravel()
    return {
        "true_negative": int(tn),
        "false_positive": int(fp),
        "false_negative": int(fn),
        "true_positive": int(tp),
    }


def choose_threshold_for_model(
    y_true: np.ndarray,
    proba: np.ndarray,
    recall_floor: float = 0.85
) -> Tuple[float, dict]:
    """Perform a sweep to locate a threshold maximizing precision subject to recall >= recall_floor.
    
    If no threshold satisfies the recall floor constraint, fallback to maximizing the F1 score.
    """
    thresholds = np.linspace(0.05, 0.95, 91)
    sweep_results = []
    
    for t in thresholds:
        t_val = round(float(t), 2)
        preds = (proba >= t_val).astype(int)
        
        rec = float(recall_score(y_true, preds, zero_division=0))
        prec = float(precision_score(y_true, preds, zero_division=0))
        f1 = float(f1_score(y_true, preds, zero_division=0))
        acc = float(accuracy_score(y_true, preds))
        
        sweep_results.append({
            "threshold": t_val,
            "recall": rec,
            "precision": prec,
            "f1": f1,
            "accuracy": acc,
            "meets_recall": rec >= recall_floor
        })
        
    sweep_df = pd.DataFrame(sweep_results)
    eligible = sweep_df[sweep_df["meets_recall"] == True]
    
    if eligible.empty:
        # Fallback: Sort by F1 (descending), then recall (descending), then threshold (descending)
        best = sweep_df.sort_values(
            by=["f1", "recall", "threshold"],
            ascending=[False, False, False]
        ).iloc[0].to_dict()
        meets_recall = False
    else:
        # Sort by precision (descending), then F1 (descending), then threshold (descending)
        best = eligible.sort_values(
            by=["precision", "f1", "threshold"],
            ascending=[False, False, False]
        ).iloc[0].to_dict()
        meets_recall = True
        
    return float(best["threshold"]), {
        "best_selection_metrics": best,
        "meets_recall": meets_recall,
        "scan_data": sweep_results
    }
