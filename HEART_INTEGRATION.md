# Heart Disease Module — Integration Contract

The heart-disease ML pipeline is developed independently. This document is the
**complete and only** contract required to integrate it. You do **not** need to
modify the React frontend, API routes, database schema, Docker setup, or
Kubernetes manifests.

## Current state

`POST /api/v1/predict/heart` returns HTTP `503`:

```json
{
  "detail": {
    "status": "not_ready",
    "disease": "heart_disease",
    "message": "Heart disease prediction module is currently being integrated."
  }
}
```

No probabilities, labels, charts, or SHAP values are fabricated.

## Files you replace / add

| File | Action |
|------|--------|
| `models/heart/heart_model.joblib` | **Add** your trained inference artifact |
| `models/heart/metadata.json` | **Add** your model metadata |
| `backend/app/services/heart_service.py` | **Replace** the placeholder body with real inference |
| `backend/app/schemas/prediction.py` | **Add** your heart feature request schema (e.g. `HeartFeatures`) |
| `backend/app/api/routes/predict.py` | **Add one line** mapping `"heart"` → `HeartFeatures` in `REQUEST_SCHEMAS` |

That is the entire surface area. No other files change.

## Required interface

Your service must implement `DiseasePredictionService`
(in `backend/app/services/prediction_service.py`):

```python
class DiseasePredictionService(ABC):
    disease: str = "heart_disease"
    def is_ready(self) -> bool: ...
    def predict(self, input_data: dict) -> PredictionResponse: ...
    def explain(self, input_data: dict) -> list[Factor]: ...
    def get_model_metadata(self) -> ModelInfo: ...
    def statistics(self) -> dict: ...   # optional
```

### `predict(input_data)` response

Must return the **same common shape** the diabetes module uses:

```json
{
  "disease": "heart_disease",
  "prediction": 1,
  "probability": 0.73,
  "risk_band": "High",
  "threshold": 0.45,
  "top_factors": [
    {"feature": "thalach", "impact": 0.18, "direction": "increases_risk", "shap_value": 0.18}
  ],
  "model_version": "1.0.0",
  "disclaimer": "This system provides ... not a medical diagnostic tool ..."
}
```

### `explain(input_data)` response

```json
[
  {"feature": "cp", "impact": 0.12, "direction": "increases_risk", "shap_value": 0.12},
  {"feature": "oldpeak", "impact": 0.09, "direction": "decreases_risk", "shap_value": -0.09}
]
```

Direction MUST be `"increases_risk"` or `"decreases_risk"`. Use wording such as
"contributed to the model prediction" — never "caused heart disease".

### `get_model_metadata()` response

```json
{
  "disease": "heart_disease",
  "status": "ready",
  "model_name": "heart_risk_classifier",
  "model_version": "1.0.0",
  "selected_family": "random_forest",
  "feature_names": ["age", "sex", "cp", "trestbps", "chol", ...],
  "threshold": 0.45,
  "risk_bands": {"Low": [0.0, 0.33], "Moderate": [0.33, 0.66], "High": [0.66, 1.01]},
  "test_metrics": {"accuracy": ..., "precision": ..., "recall": ..., "f1": ..., "roc_auc": ..., "confusion_matrix": {...}},
  "validation_metrics": {...}
}
```

## Reference implementation pattern

Mirror `backend/app/services/diabetes_service.py` and
`backend/app/ml/diabetes/loader.py`:

1. Load your artifact **once** at startup in a loader module; build the SHAP
   explainer once.
2. In `HeartPredictionService.predict()`, validate input, call the loaded
   pipeline for probability, apply your stored threshold, map to a risk band,
   compute SHAP factors, and return `PredictionResponse`.
3. Set `is_ready()` to reflect actual load state.
4. Register the service in `backend/app/services/registry.py` (it is already
   registered; the class you replace is all that changes).

## Non-negotiable rules

- **Never fabricate** metrics, probabilities, or SHAP values.
- Fit preprocessing (imputation, scaling) on **training data only**.
- Pick the decision threshold using **cross-validated training predictions**,
  never the held-out test set.
- **Do not train or tune during a request.** Load at startup only.
- Use the same risk-band definitions (configurable) as diabetes.
- Include the required disclaimer in every prediction response.
- Store only non-PII prediction metadata — the existing `predictions` table
  already works with `disease_type="heart_disease"`.

## What the frontend does automatically

Once `is_ready()` returns `True` and `predict()` returns 200 with the common
shape, the existing reusable `PredictionPage` automatically renders:

- the input form (driven by the field list you add to
  `frontend/src/config/diseases.ts` — one config object, no new component),
- the probability/risk band,
- the SHAP factor chart,
- model info and analytics.

The heart page's "not ready" placeholder disappears automatically. No React
architecture changes are required.
