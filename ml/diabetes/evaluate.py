"""Evaluation helpers for the diabetes models.

All metric functions take raw probabilities and a threshold so the same code
path works for cross-validation, threshold selection, and final test reporting.
"""
from __future__ import annotations

from typing import Dict, Iterable, List

import numpy as np
from sklearn.metrics import (
    accuracy_score,
    confusion_matrix,
    f1_score,
    precision_score,
    recall_score,
    roc_auc_score,
)


def labels_from_proba(proba: np.ndarray, threshold: float) -> np.ndarray:
    return (np.asarray(proba) >= threshold).astype(int)


def compute_metrics(
    y_true: Iterable[int],
    proba: np.ndarray,
    threshold: float,
) -> Dict[str, float]:
    """Compute accuracy/precision/recall/f1/roc-auc for a given threshold."""
    y_true = np.asarray(y_true).astype(int)
    proba = np.asarray(proba, dtype=float)
    y_pred = labels_from_proba(proba, threshold)

    return {
        "threshold": round(float(threshold), 4),
        "accuracy": round(float(accuracy_score(y_true, y_pred)), 4),
        "precision": round(float(precision_score(y_true, y_pred, zero_division=0)), 4),
        "recall": round(float(recall_score(y_true, y_pred, zero_division=0)), 4),
        "f1": round(float(f1_score(y_true, y_pred, zero_division=0)), 4),
        "roc_auc": round(float(roc_auc_score(y_true, proba)), 4),
    }


def confusion_matrix_as_dict(y_true: Iterable[int], y_pred: Iterable[int]) -> Dict[str, int]:
    """Return a named confusion matrix for JSON serialisation."""
    cm = confusion_matrix(y_true, y_pred, labels=[0, 1])
    tn, fp, fn, tp = cm.ravel()
    return {
        "true_negative": int(tn),
        "false_positive": int(fp),
        "false_negative": int(fn),
        "true_positive": int(tp),
    }


def scan_thresholds(
    y_true: Iterable[int],
    proba: np.ndarray,
    thresholds: List[float],
    precision_floor: float = 0.50,
) -> List[Dict[str, float]]:
    """Evaluate every candidate threshold, recall-prioritized.

    Used on CROSS-VALIDATED training predictions only (never the test set).
    """
    rows = []
    for t in thresholds:
        m = compute_metrics(y_true, proba, t)
        rows.append(m)
    return rows


def choose_threshold(
    y_true: Iterable[int],
    proba: np.ndarray,
    thresholds: List[float],
    precision_floor: float = 0.50,
) -> float:
    """Select the threshold that maximizes recall while keeping precision >= floor.

    If no threshold meets the precision floor, fall back to the threshold with
    the highest F1 (balanced choice). The selection is deterministic and is
    logged for transparency.
    """
    results = scan_thresholds(y_true, proba, thresholds, precision_floor)

    eligible = [r for r in results if r["precision"] >= precision_floor]
    if eligible:
        # Highest recall; tie-break on higher F1 then lower threshold.
        best = max(
            eligible,
            key=lambda r: (r["recall"], r["f1"], -r["threshold"]),
        )
        return float(best["threshold"])

    # Fallback: best F1
    best = max(results, key=lambda r: (r["f1"], r["recall"]))
    return float(best["threshold"])
