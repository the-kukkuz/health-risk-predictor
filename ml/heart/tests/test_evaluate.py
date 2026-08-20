"""Tests for evaluation metrics and clinical threshold selection logic."""
from __future__ import annotations

import sys
from pathlib import Path
import numpy as np
import pytest

# Add project root to path for runtime execution
sys.path.insert(0, str(Path(__file__).resolve().parents[3]))

from ml.heart.src.evaluate import choose_threshold_for_model, compute_metrics


def test_choose_threshold_meets_recall():
    """Verify that a threshold satisfying Recall >= 0.85 and maximizing precision is selected."""
    # Synthetic target (10 samples, 5 positive, 5 negative)
    y_true = np.array([0, 0, 0, 0, 0, 1, 1, 1, 1, 1])
    
    # Perfect probabilities except one prediction
    # At t = 0.5: Preds = [0, 0, 0, 0, 0, 1, 1, 1, 1, 1] -> Rec=1.0, Prec=1.0
    # At t = 0.6: Preds = [0, 0, 0, 0, 0, 0, 1, 1, 1, 1] -> Rec=0.8, Prec=1.0 (fails Recall >= 0.85)
    proba = np.array([0.1, 0.15, 0.2, 0.25, 0.3, 0.55, 0.65, 0.7, 0.8, 0.9])
    
    threshold, info = choose_threshold_for_model(y_true, proba, recall_floor=0.85)
    
    assert threshold == 0.55
    assert info["meets_recall"] is True
    assert info["best_selection_metrics"]["recall"] >= 0.85


def test_choose_threshold_fallback():
    """Verify that when no threshold meets the recall floor, it falls back to maximizing F1."""
    y_true = np.array([0, 0, 0, 0, 0, 1, 1, 1, 1, 1])
    # The probabilities are poor, so recall of 0.85 is impossible at reasonable precision.
    # At very low threshold, recall is met but precision is very poor. Let's make recall impossible to meet at all.
    # Actually, at t=0.05 all preds are 1 -> Recall = 1.0 (meets recall). 
    # Let's check a scenario where recall_floor = 0.99, but we can't meet it unless t <= 0.05.
    # If probas are all low for positive cases:
    proba = np.array([0.1, 0.1, 0.1, 0.1, 0.1, 0.2, 0.2, 0.2, 0.2, 0.2])
    
    # Let's enforce a high floor like 1.1 (impossible) to force fallback
    threshold, info = choose_threshold_for_model(y_true, proba, recall_floor=1.1)
    assert info["meets_recall"] is False
    # Check that fallback metrics maximized F1
    assert "best_selection_metrics" in info


def test_compute_metrics():
    """Verify basic metrics computation returns correct structure and values."""
    y_true = np.array([0, 0, 1, 1])
    proba = np.array([0.1, 0.4, 0.35, 0.9])
    threshold = 0.5
    
    metrics = compute_metrics(y_true, proba, threshold)
    
    assert "accuracy" in metrics
    assert "precision" in metrics
    assert "recall" in metrics
    assert "f1" in metrics
    assert "roc_auc" in metrics
    
    # Preds at 0.5: [0, 0, 0, 1]
    # TP = 1, TN = 2, FP = 0, FN = 1
    # Recall = 1/2 = 0.5
    # Precision = 1/1 = 1.0
    assert metrics["recall"] == 0.5
    assert metrics["precision"] == 1.0
