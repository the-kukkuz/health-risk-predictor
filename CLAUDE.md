# CLAUDE.md

Project context for Claude Code (or any AI coding agent) working on the **Health Risk Predictor** repo. Read this before making changes — it reflects the current PRD (v2, Aug 18 2026) and the latest team decisions, which supersede anything in older code comments or docs.

## What this project is

A healthcare decision-support web app that predicts **diabetes** and **heart disease** risk from clinical inputs. It is explicitly **decision-support, not a diagnostic device** — every prediction-facing surface must carry a disclaimer. Core deliverables: two disease classification pipelines, explainable AI (SHAP), a unified UI, an analytics dashboard, and a RAG-based Q&A/SOS layer.

**Primary evaluation criterion (per mentor): recall ≥ 0.85 on both disease models.** Don't let secondary features (RAG, ensembling, polish) take priority over this or over getting heart disease to parity with diabetes.

## Scope boundaries

- Only two conditions: **diabetes** and **heart disease**. Hypertension is NOT a third module — it only appears as an input feature (blood pressure) inside the two models. Don't build a hypertension classifier.
- Not a diagnostic/regulatory-cleared device. Don't remove or weaken disclaimer copy.
- External datasets beyond Pima (diabetes) and Cleveland (heart) are **pending mentor approval** — don't add new data sources without checking first.
- Cleveland is the primary, clean heart disease dataset (verified no missing values) — use it as the base, not the noisier combined 4-region UCI set.

## Architecture

```
Frontend (React/Vite/TS/Tailwind)
        │ REST — POST /api/v1/predict/{disease}
        ▼
Backend (FastAPI) — service registry per disease
        │
        ├── PostgreSQL (prediction metadata)
        └── Trained ML artifact (scikit-learn + SHAP), loaded once at startup
```

- **Disease-agnostic contract**: frontend and API never hardcode disease-specific logic. Each disease has a service implementing a shared abstract base class; the frontend renders forms/results off a per-disease config, not hardcoded components.
- **Common API response shape** (keep consistent across diseases): `prediction`, `probability`, `risk_band`, `threshold`, `top_factors` (SHAP), `model_version`, `disclaimer`.
- **Training pipeline is offline**, separate from the serving app. It produces a serialized artifact (model + metadata) that the backend loads at startup. Never train/tune/refit during a live request.
- **No test-set leakage** — anywhere. Threshold selection uses out-of-fold (OOF) probabilities on training data only, never the held-out test set.
- A disease with no trained model must return a clear "not ready" state (e.g. `503`) — never fabricate a prediction.

## Frontend structure (target — current repo doesn't fully reflect this yet)

Persistent **left sidebar** nav once logged in: Home, Analysis, Dashboard, History. Not shown on Sign In / Sign Up.

1. **Sign In** / **Sign Up** — two separate auth pages, matched visual style.
2. **Home** — platform overview stats, "Start Assessment" CTA, recent history preview.
3. **Analysis** — single page, three internal states, no page navigation between them:
   - State A: condition selection (Diabetes / Heart Disease checkboxes, both selectable — never a hard either/or fork)
   - State B: data entry — only relevant fields render; if both selected, one combined form grouped demographics → diabetes fields → heart fields. Categorical fields (high BP, high cholesterol) use **dropdowns**, never free text.
   - State C: results — risk band + SHAP top-factors per selected condition. RAG chat button (left-edge slide-in panel) appears only here.
4. **Dashboard** — two tabs:
   - **Platform Analytics** (default): general, non-technical stats (usage volume, age-group breakdown). No ML jargon — this is for regular users.
   - **Model Analytics**: dropdown to switch Diabetes/Heart Disease, 4 sub-tabs (LR, SVM, RF, GB) showing recall/precision/F1/ROC-AUC per model. This is evaluator-facing; keep it visually distinct/denser, but don't gate it behind real auth for the demo.
5. **History** — card list of past sessions (condition(s), date, risk band). Expanding a card reopens the full Analysis "State C" results view, RAG chat included.
6. **RAG chat** — not a sidebar item or standalone page. Only ever appears alongside an actual result (Analysis State C, or an expanded History card).

## ML pipeline conventions (per disease)

- Preprocessing: for Pima diabetes data, biologically-invalid zeros (Glucose, BloodPressure, SkinThickness, Insulin, BMI) → NaN before imputation; `Pregnancies = 0` is valid and stays as-is.
- Median imputation + scaling inside a `Pipeline`/`ColumnTransformer`, fit on training data only.
- Compare four models: Logistic Regression, SVM, Random Forest, Gradient Boosting.
- Threshold tuning: search thresholds using OOF probabilities, optimize for recall subject to a precision floor — don't default to 0.5.
- Report full metrics honestly (accuracy, precision, recall, F1, ROC-AUC), including cases where recall < 0.85 — never hide a miss.
- SHAP for per-prediction local explanations; risk bands (Low/Moderate/High) are explicitly model-defined, not clinical categories — label them that way in any UI copy.

## Ensembling — currently unresolved, ask before implementing

Mentor described this inconsistently as "average of the best two models" and "average of the highest models" in the same discussion. **Do not implement ensembling until the team confirms top-2 vs. top-N** — this changes the code shape. Treat this as a stretch goal after both disease models individually hit the recall target.

## RAG / SOS layer

- Ground medication/clarification answers in a vetted clinical corpus — not open web scraping.
- SOS/emergency escalation must be **rules-based**, not left to free-form LLM reasoning. Symptom red flags → deterministic escalation path.
- Every medication/symptom answer carries a visible disclaimer pointing to a clinician.
- UI placement: only within Analysis results or an expanded History card, never elsewhere.

## Deployment

Target is **Google Cloud Platform (GCP)** — mentor flagged this as a required deliverable, not optional. Docker/K8s manifests already work locally for the diabetes-only scope; GCP deployment is still outstanding and should be prioritized once both disease models meet the recall target.

## Current status snapshot (Aug 18 2026 — update as work lands)

| Area | Status |
|---|---|
| Diabetes pipeline (data → model → SHAP → API → UI) | Done |
| Heart disease pipeline | Not started (placeholder only, `503`) |
| Consolidated single-page Analysis flow | Not started (current UI still routes per-disease) |
| Dropdown categorical inputs | Not started |
| Dashboard two-tab structure | Not started (old model-info layout still in place) |
| History page | Not started |
| Ensembling | Not started (method unresolved — see above) |
| RAG Q&A + SOS | Not started |
| GCP deployment | Not started (local Docker/K8s only) |

## Priority order for new work

1. Heart disease pipeline (mirror diabetes pattern, Cleveland dataset)
2. Verify recall ≥ 0.85 on both diseases
3. Consolidated Analysis page + dropdown inputs + sidebar nav rework
4. GCP deployment
5. RAG Q&A + SOS (small vetted corpus + hard-coded SOS rules first)
6. Ensembling (only after top-2 vs top-N is resolved with the team)
7. Dashboard two-tab split + History page
