# Product Requirements Document
## Healthcare & Risk — Disease Risk Predictor (Diabetes + Heart Disease)

**Status:** Draft v2 — updated post team meeting (Aug 17, 2026)
**Date:** August 18, 2026

---

## 1. Overview

A healthcare decision-support system that stratifies risk for two conditions — diabetes and heart disease — from routinely-collected clinical inputs. The system is explicitly a **decision-support tool, not a diagnostic device**. It combines classical ML classification, explainable AI (SHAP), and a RAG-based conversational layer for medication/clarification/SOS Q&A.

## 2. Problem Statement

Diabetes, heart disease, and hypertension are usually diagnosed only after symptoms appear, by which point treatment cost and clinical risk are already elevated. Screening-relevant data (glucose, BMI, blood pressure, cholesterol, age, lifestyle indicators) is routinely collected but rarely used proactively to stratify risk in advance.

> **Scope confirmed (Aug 17 meeting):** hypertension is explicitly excluded as a standalone module. It appears only as an input feature (blood pressure) within the diabetes and heart disease models — not as a third disease to classify.

## 3. Goals / Objectives

- Clean and impute clinical data for both datasets.
- Compare Logistic Regression, SVM, Random Forest, and Gradient Boosting per disease.
- Tune each model for **recall ≥ 0.85** (minimize missed at-risk patients).
- Deploy a decision-support dashboard — explicitly not a diagnosis — with risk bands, explanations, and population trends.
- Provide a RAG-based Q&A layer for medication questions, general clarifications, and SOS/emergency guidance.
- Provide model comparison + optional ensembling (soft-voting average across top models).

## 4. Non-Goals

- Not a diagnostic or regulatory-cleared medical device.
- Not intended to replace clinician judgment or emergency services.
- Not designed to handle conditions beyond diabetes and heart disease in this phase.

## 5. Users

- Primary: individuals checking personal risk indicators (decision-support, not self-diagnosis). See **platform analytics** and general dashboard views — no technical ML detail surfaced to this group.
- Secondary: hackathon/academic evaluators, viewing **technical analytics** (per-model metrics) — kept visually and navigationally separate from the primary user experience, not gated behind auth for the demo.

## 6. Functional Requirements

### 6.1 Data Input UI — consolidated Analysis flow (latest revision)
- **Analysis page is a single page with an internal flow**, not separate pages per step: condition selection → conditional data entry → results, all within one "Analysis" screen.
- Step 1 (within Analysis): user selects Diabetes, Heart Disease, or both (checkbox, not either/or).
- Step 2 (within Analysis): only the relevant fields render — diabetes fields only, heart fields only, or a combined form (grouped: demographics → diabetes fields → heart fields) if both selected.
- Categorical fields (e.g. high blood pressure, high cholesterol) use **dropdown menus**, not free text or vague subjective scales.
- Every field carries a unit label and a short inline expected-range hint.
- Input validation — reject invalid/missing data rather than silently accepting it, with clear non-alarming inline error messaging before submission.
- Step 3 (within Analysis): results render in the same page/flow — risk band + SHAP explanation per selected condition, with the RAG chat button appearing at this point.
- Still driven by a shared, generic config-per-field approach rather than hardcoded disease-specific UIs.

### 6.1.1 Page / Screen Structure (latest revision)
**Auth:**
1. Sign in
2. Sign up

**Main app (persistent left sidebar navigation once logged in):**
3. Home — platform overview data, "Start assessment" CTA, history preview, other summary info
4. Analysis — single-page flow: condition selection → data entry (conditional/combined) → results (risk band + SHAP); RAG chat button appears once results are shown
5. Dashboard — two tab-style buttons:
   - **Platform Analytics** tab: general, understandable stats (e.g. age group breakdown of users, usage volume) — no ML jargon
   - **Model Analytics** tab: performance of all 4 models (LR, SVM, RF, GB) for both diabetes and heart disease, with a dropdown to switch between the two diseases
6. History — card list of prior sessions; expanding a card reopens the full Analysis results view, RAG chat included

RAG chat is not a standalone sidebar item — it's a left-side slide-in panel, available only when viewing a result (live in Analysis, or reopened from History).

### 6.2 Classification Core (per disease)
- Preprocessing: handle biologically-invalid zero values as missing (Glucose, BloodPressure, SkinThickness, Insulin, BMI for diabetes); impute (median) + scale, fit on training data only (no leakage).
- Train and compare LR, SVM, RF, Gradient Boosting.
- Threshold selection tuned for recall ≥ 0.85 with a precision floor, selected via out-of-fold probabilities (never the test set).
- Report full metrics (accuracy, precision, recall, F1, ROC-AUC) honestly, including cases where the 0.85 target isn't met.

### 6.3 Explainable AI
- Per-prediction local SHAP factors (top contributing features + direction of impact).
- Risk bands (e.g., Low/Moderate/High), explicitly labeled as model-defined, not clinical categories.

### 6.4 Ensembling (stretch goal beyond core comparison)
- Soft-voting / weighted average across top-performing models per disease.
- Report whether the ensemble improves on the single best model — not assumed by default.
- ⚠️ **Open question from Aug 17 meeting**: mentor referenced this both as "average of the best two models" and "average of the highest models" in the same discussion — needs to be pinned down as top-2 specifically vs. a variable top-N before implementation, since it changes the code.

### 6.5 RAG-Based Q&A
- Medication and general clarification Q&A grounded in a vetted clinical corpus (not open web scraping).
- SOS/emergency path: rules-based escalation for symptom red flags, not left to LLM free-form reasoning.
- Every medication/symptom answer carries a visible disclaimer directing to a clinician.

### 6.6 Dashboard — two-tab analytics hub (latest revision)
- **Analysis page** (not "Results" — renamed): the single-page flow itself carries the individual result view — prediction, risk band, SHAP explanation, per selected condition.
- **Dashboard page**, reached via the left sidebar, holds two tab-style buttons:
  - **Platform Analytics** tab: general, non-technical stats — usage volume, demographic breakdown (age groups, etc.) — understandable by any user.
  - **Model Analytics** tab: performance of all 4 models (LR, SVM, RF, GB), for both diabetes and heart disease, switchable via a dropdown between the two diseases.
- **History page**: card-based list of prior sessions (condition(s), date, risk band at a glance); expanding a card reopens the full Analysis result view, RAG chat included.

### 6.7 Reliability Rules
- No training/tuning/refitting during live requests.
- No test-set leakage anywhere in preprocessing or threshold selection.
- A disease module with no trained model returns a clear "not ready" state — never a fabricated prediction.
- No disease-specific logic embedded in the frontend; driven by shared config.

## 7. Architecture (current direction)

```
Frontend (React/Vite/TS/Tailwind)
        │ REST — POST /api/v1/predict/{disease}
        ▼
Backend (FastAPI) — service registry per disease
        │
        ├── PostgreSQL (prediction metadata)
        └── Trained ML artifact (scikit-learn + SHAP), loaded once at startup
```

Common response shape across diseases: `prediction`, `probability`, `risk_band`, `threshold`, `top_factors` (SHAP), `model_version`, `disclaimer`.

**Deployment target:** mentor flagged cloud deployment as a requirement, specifically Google Cloud Platform (GCP), to be prioritized once core objectives (recall target, both disease models) are met.

**Data source note (corrected post-meeting):** Cleveland is the clean, primary heart disease dataset (no missing values, per team verification) — treat it as the primary source rather than the combined 4-region set. Use of additional external datasets is **pending mentor approval**; do not assume they're permitted yet.

## 8. Success Metrics

- Recall ≥ 0.85 achieved (or honestly reported if not) for each disease model.
- Both disease modules fully functional end-to-end (input → prediction → explanation).
- RAG Q&A answers grounded and disclaimer-tagged, with SOS escalation working reliably.
- Dashboard usable for both individual and population-level views.

---

## 9. Meeting Decisions Log — Aug 17, 2026

**Aligned:**
- Scope limited to diabetes + heart disease, hypertension excluded as a module.
- Single unified flow rather than fully separate per-condition pages (implemented via checkbox selection + conditional/combined data entry, not a hard fork).
- Dropdown inputs for categorical fields (high BP, high cholesterol).
- Analytics split: platform analytics (general users) vs. technical analytics (evaluators).
- Priority is the 0.85 recall target and core requirements over secondary/optional features.
- Cloud deployment on GCP required before/alongside optional add-ons.

**Pending:**
- External dataset usage — awaiting mentor confirmation.
- Medical report upload as an additional feature — awaiting mentor confirmation.
- Ensembling method (top-2 vs. top-N average) — needs internal team decision.

**Action items:**
- [ ] Team: visual design draft of the unified diagnostic flow (in progress via this PRD + Snitch prompt)
- [ ] Team: deploy the decision-support dashboard
- [ ] Team: add risk bands + population trends to dashboard
- [ ] Team: validate two diabetes test cases against user input
- [ ] Mentor (Hashim Basheer): confirm external dataset + medical report upload permissions; schedule next cross-team call

---

## 10. Current Status vs. PRD (as of this review)

Based on the `health-risk-predictor` repository reviewed:

| Area | Status | Notes |
|---|---|---|
| Architecture / API contract | **Done** | Common `/api/v1/predict/{disease}` shape, service registry pattern, generic config-driven frontend already in place. |
| Diabetes — data cleaning & preprocessing | **Done** | Invalid zeros → NaN, median imputation + scaling in a leak-free pipeline. |
| Diabetes — model comparison (LR/SVM/RF/GB) | **Done** | All four trained and compared with nested CV. |
| Diabetes — recall ≥0.85 tuning | **Done** | LR selected at threshold 0.30, recall 0.889 — target met on this split. |
| Diabetes — explainable AI (SHAP) | **Done** | Per-prediction local SHAP factors returned via API. |
| Diabetes — risk bands | **Done** | Low/Moderate/High, explicitly non-clinical labeling. |
| Diabetes — input UI | **Done** | Generic prediction form wired to diabetes config. |
| Diabetes — population analytics | **Done** | `/api/v1/statistics/diabetes` implemented. |
| Heart disease — everything | **Not started** | Explicit placeholder; `/api/v1/predict/heart` returns `503 not_ready`. Schema/interface stubbed, no data pipeline, no trained model. Now confirmed to use Cleveland (clean) as primary source. |
| Unified diagnostic flow (single Analysis page: selection → entry → results) | **Not started** | Current UI still assumes disease-specific routing across separate pages, not the consolidated single-page Analysis flow — needs rework, not just extension. |
| Dropdown-based categorical inputs | **Not started** | Not yet reflected in the current form implementation. |
| Ensembling | **Not started** | Only single-best-model selection exists; no soft-voting/averaging implemented anywhere. Method (top-2 vs top-N) still unresolved. |
| RAG-based Q&A (medication/clarification) | **Not started** | No corpus, no retrieval layer, no Q&A endpoint in the repo. Placement (within Analysis results + History-detail only) now specified. |
| SOS / emergency escalation logic | **Not started** | No rules-based escalation path implemented. |
| Dashboard (Platform Analytics + Model Analytics tabs) | **Partially done** | Frontend pages exist but reflect the old model-info layout, not the new two-tab structure with the disease dropdown inside Model Analytics. |
| History page | **Not started** | Newly added requirement; not present in current repo. |
| Deployment (Docker/K8s) | **Done locally** | Docker Compose and Kubernetes manifests functional for current (diabetes-only) scope; GCP cloud deployment specifically is still outstanding. |

### Rough completion estimate

Weighting the PRD's major scope areas roughly evenly (diabetes core, heart core, ensembling, RAG/SOS, dashboard, infra):

- **Diabetes module: ~90–95% complete** against its own scope (core ML + XAI + API + UI + analytics all done; only ensembling for this disease is missing).
- **Heart disease module: ~5% complete** (interface stub and integration doc exist; no data pipeline, model, or evaluation).
- **Ensembling: 0% complete** (not implemented for either disease).
- **RAG Q&A + SOS: 0% complete** (entirely unbuilt).
- **Dashboard/analytics: ~60% complete** (UI shell + diabetes data done; heart data missing, so population/comparison views are incomplete).
- **Infra/deployment: ~90% complete** (Docker + K8s working for current scope; would need minor updates once heart module lands).

**Overall, against the full PRD scope: roughly 35–40% complete.** The strongest, most defensible piece of work so far is the diabetes prediction pipeline end-to-end (data → model → XAI → API → UI). The two largest remaining bodies of work are (1) replicating that same rigor for heart disease, and (2) building the RAG/SOS layer from scratch — neither of which currently exists in any form in the repo.

### Suggested next priorities (in order, per mentor emphasis on core requirements first)
1. **Heart disease pipeline** using Cleveland as primary source, mirroring the diabetes pattern (same preprocessing/threshold/SHAP approach) — fastest way to raise overall completion.
2. **Recall ≥0.85 tuning verified on both diseases** — explicitly the primary evaluation criterion per mentor.
3. **Consolidated Analysis page rework** — single-page selection → conditional/combined entry → results flow, plus dropdown inputs, plus persistent left sidebar nav — since this is now the confirmed UX direction and the current repo doesn't reflect it yet.
4. **GCP deployment** — flagged directly by mentor as a required deliverable, not optional.
5. RAG Q&A + SOS layer — start with a small vetted corpus and a hard-coded SOS rule set before layering in retrieval; scope its UI placement to Results + History-detail only.
6. Ensembling — resolve top-2 vs top-N first, then implement; do this last per mentor's explicit "core requirements before add-ons" guidance.
7. Platform/technical analytics split + past history page.
