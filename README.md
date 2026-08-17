# Health Risk Predictor

A healthcare **disease risk-stratification and decision-support** system. It
exposes interchangeable, disease-specific prediction services behind a single
common API. The **diabetes** module is fully implemented; the **heart disease**
module is a clean placeholder awaiting independent integration.

> **Disclaimer** — This system provides machine-learning-based risk
> stratification for research and decision-support purposes. It is **not a
> medical diagnostic tool** and should not be used as a substitute for
> professional medical evaluation.

---

## Architecture

```
React (Vite + TS + Tailwind + Recharts)
        │  REST (relative /api)
        ▼
FastAPI  ── service registry ──▶ DiabetesPredictionService  (IMPLEMENTED)
                              └─▶ HeartPredictionService     (PLACEHOLDER → 503)
        │
        ├── PostgreSQL (prediction metadata, disease-agnostic schema)
        └── Trained ML artifact loaded ONCE at startup (scikit-learn + SHAP)
```

The frontend knows **only** `POST /api/v1/predict/{disease}` and the common
response shape. It has no knowledge of how any specific model is built.

---

## Repository structure

```
health-risk-predictor/
├── frontend/            React + Vite + TypeScript + Tailwind + Recharts
│   └── src/
│       ├── components/  Reusable form, result, not-ready, error, charts
│       ├── pages/       Dashboard, PredictionPage (reusable), Analytics, ModelInfo
│       ├── charts/      Recharts visualizations
│       ├── config/      Disease configuration (drives the reusable UI)
│       ├── services/    API client
│       └── types/       Shared TypeScript types
├── backend/             FastAPI application
│   ├── app/
│   │   ├── api/routes/  health, models, predict, statistics, predictions
│   │   ├── schemas/     Pydantic models
│   │   ├── services/    Common ABC + diabetes service + heart placeholder
│   │   ├── ml/          Artifact loader (diabetes) + heart interface
│   │   ├── models/      SQLAlchemy ORM
│   │   ├── db/          Engine / session
│   │   └── core/        Settings
│   └── tests/           API tests
├── ml/diabetes/         Training pipeline (preprocessing, train, evaluate, predict, explain)
│   ├── config.py
│   ├── preprocessing.py
│   ├── train.py
│   ├── evaluate.py
│   ├── predict.py
│   ├── explain.py
│   └── tests/
├── models/diabetes/     Serialized artifact + metadata (generated)
├── data/diabetes/       UCI Pima Indians dataset
├── k8s/                 Kubernetes manifests
├── docker-compose.yml
├── .env.example
└── HEART_INTEGRATION.md
```

---

## Quick start (Docker Compose — recommended)

Requirements: Docker + Docker Compose. No local Python/Node/PostgreSQL needed.

```bash
cd health-risk-predictor
cp .env.example .env
docker compose up --build
```

| Service  | URL                     |
|----------|-------------------------|
| Frontend | http://localhost:8080   |
| Backend  | http://localhost:8000   |
| API docs | http://localhost:8000/docs |
| Postgres | localhost:5432 (internal) |

The pre-trained diabetes artifact is included; the backend loads it at startup.

> The `models/` and `data/` directories are mounted read-only into the backend
> container, so retraining the model does not require rebuilding the image.

### Retraining the model

The committed artifact was trained with `random_state=42`. To retrain:

```bash
# From the repo root (Python 3.10+ with the backend requirements installed)
pip install -r backend/requirements.txt
python ml/diabetes/train.py
```

This regenerates `models/diabetes/diabetes_model.joblib` and
`models/diabetes/metadata.json`. Restart the backend to load the new artifact.

---

## Local development (without Docker)

### 1. Train the model
```bash
pip install -r backend/requirements.txt
python ml/diabetes/train.py
```

### 2. Run PostgreSQL
Use Docker for just the database:
```bash
docker run --name hrp-pg -e POSTGRES_USER=riskapp -e POSTGRES_PASSWORD=riskapp \
  -e POSTGRES_DB=healthrisk -p 5432:5432 -d postgres:16-alpine
```

### 3. Run the backend
```bash
cd backend
export DATABASE_URL="postgresql+psycopg2://riskapp:riskapp@localhost:5432/healthrisk"
export MODEL_DIR="$(pwd)/../models/diabetes"
export DATA_DIR="$(pwd)/../data/diabetes"
uvicorn app.main:app --reload --port 8000
```

### 4. Run the frontend
```bash
cd frontend
npm install
npm run dev   # http://localhost:5173 (proxies /api → :8000)
```

---

## API

| Method | Path | Description |
|--------|------|-------------|
| GET  | `/health` | Liveness + DB connectivity |
| GET  | `/api/v1/models` | Metadata for all registered modules |
| POST | `/api/v1/predict/diabetes` | Diabetes prediction + SHAP |
| POST | `/api/v1/predict/heart` | Heart placeholder → **503 not_ready** |
| GET  | `/api/v1/statistics/diabetes` | Population analytics |
| GET  | `/api/v1/statistics/heart` | → `not_ready` |
| GET  | `/api/v1/predictions` | List persisted predictions |

### Diabetes request
```json
{
  "Pregnancies": 6, "Glucose": 148, "BloodPressure": 72,
  "SkinThickness": 35, "Insulin": 0, "BMI": 33.6,
  "DiabetesPedigreeFunction": 0.627, "Age": 50
}
```

### Common prediction response
```json
{
  "disease": "diabetes",
  "prediction": 1,
  "probability": 0.7964,
  "risk_band": "High",
  "threshold": 0.3,
  "top_factors": [
    {"feature": "Glucose", "impact": 0.233, "direction": "increases_risk", "shap_value": 0.233}
  ],
  "model_version": "1.0.0",
  "disclaimer": "..."
}
```

---

## Diabetes ML pipeline

* **Data:** UCI Pima Indians Diabetes — 768 rows, 8 features.
* **Cleaning:** invalid zeros in `Glucose, BloodPressure, SkinThickness,
  Insulin, BMI` → NaN. `Pregnancies=0` is kept (valid).
* **Validation:** schema (columns, types, target binarity, value ranges) is
  checked before training.
* **Split:** stratified 80/20. The test set is touched **once**, at the end.
* **Preprocessing:** median imputation + standard scaling in a sklearn
  `Pipeline`/`ColumnTransformer`, **fit on training data only** — no leakage.
* **Models compared:** Logistic Regression, SVM, Random Forest, Gradient
  Boosting.
* **Tuning:** small, recall-oriented `GridSearchCV` (5-fold) inside **nested
  cross-validation**.
* **Threshold:** selected from `[0.20…0.50]` using **out-of-fold training
  probabilities**, maximizing recall subject to a precision floor (0.50). The
  test set is never used for threshold selection.
* **Selection:** highest/near-highest OOF recall; a near-tie prefers a
  tree/linear model for fast SHAP inference.
* **XAI:** local SHAP factors returned per prediction.
* **Risk bands:** Low / Moderate / High (configurable, model-defined — not
  clinical categories).

### Actual reported performance (held-out test, `random_state=42`)

| Model | Threshold | Accuracy | Precision | Recall | F1 | ROC-AUC |
|-------|-----------|----------|-----------|--------|----|---------|
| **Logistic Regression (selected)** | **0.30** | 0.695 | 0.539 | **0.889** | 0.671 | 0.810 |
| SVM | 0.20 | 0.623 | 0.480 | 0.870 | 0.618 | 0.807 |

Confusion matrix (selected): TN=59, FP=41, FN=6, TP=48.

The aspirational target of **recall ≥ 0.85 is met (0.889)** on this split, but
the target is **not guaranteed** and the model is not a diagnostic device.
Full metrics are in `models/diabetes/metadata.json`.

### Inference performance

The model and SHAP explainer are loaded **once at startup**. After the ~6s
one-time startup cost, a `predict` request (inference + SHAP) runs in
**~8 ms**.

---

## Heart disease module (placeholder)

The heart module returns `503 not_ready` and never fabricates results. To
integrate the independently developed model, follow
[**HEART_INTEGRATION.md**](./HEART_INTEGRATION.md). Integration requires only:

1. add the heart artifact,
2. implement `HeartPredictionService` against the common ABC,
3. register the feature schema (one line).

**No changes** are needed to the React prediction architecture, API response
format, PostgreSQL schema, Docker, or Kubernetes.

---

## Testing

```bash
# Backend API tests (uses SQLite automatically)
cd backend && python -m pytest -q

# ML pipeline tests
cd .. && python -m pytest ml/diabetes/tests -q

# Frontend tests
cd frontend && npm test
```

---

## Kubernetes

Simple manifests for a deployment target are in `k8s/`:

```bash
kubectl apply -f k8s/namespace.yaml
kubectl apply -f k8s/configmap.yaml
kubectl apply -f k8s/secrets.yaml
kubectl apply -f k8s/postgres.yaml
kubectl apply -f k8s/backend.yaml
kubectl apply -f k8s/frontend.yaml
```

* The backend has **readiness and liveness probes** on `/health`.
* Build & push `health-risk/backend:latest` and `health-risk/frontend:latest`
  to your registry first, or update the `image:` fields.
* Replace the example `POSTGRES_PASSWORD` in `secrets.yaml` for any real
  cluster.

Docker Compose is the primary local-development environment; Kubernetes is the
deployment deliverable.

---

## Configuration (environment variables)

| Variable | Default | Description |
|----------|---------|-------------|
| `DATABASE_URL` | — | Full Postgres URL (overrides parts below) |
| `POSTGRES_USER/PASSWORD/DB/HOST/PORT` | riskapp / … | DB connection parts |
| `MODEL_DIR` | `models/diabetes` | Directory containing the joblib artifact |
| `DATA_DIR` | `data/diabetes` | Dataset directory (for analytics) |
| `CORS_ORIGINS` | localhost:5173,8080 | Comma-separated allowed origins |
| `ENVIRONMENT` | development | Logging/env label |

No credentials are hard-coded.

---

## Reliability rules enforced

* No training/tuning/refitting during requests.
* No test-set leakage in preprocessing or threshold selection.
* Invalid/missing input is rejected (422), never silently accepted.
* Metrics are reported honestly; nothing is fabricated.
* Heart returns 503, never fake predictions.
* No disease-specific logic in React — everything is driven by a config object
  and the common response shape.
