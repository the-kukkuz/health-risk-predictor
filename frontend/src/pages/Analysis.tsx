import { useMemo, useState } from "react";
import { DISEASES } from "../config/diseases";
import type { DiseaseConfig, PredictionResponse } from "../types";
import AnalysisForm from "../components/AnalysisForm";
import RiskResult from "../components/RiskResult";
import InlineChat from "../components/InlineChat";
import Icon from "../components/Icon";

type State =
  | { kind: "select" }
  | { kind: "entry"; selected: string[] }
  | { kind: "results"; selected: string[]; results: Record<string, PredictionResponse>; errors: Record<string, string> };

// Demo results shown when the backend is not reachable, so the UI is fully
// explorable without a running API. Matches the PredictionResponse schema.
const DEMO_RESULTS: Record<string, PredictionResponse> = {
  diabetes: {
    disease: "diabetes",
    prediction: 1,
    probability: 0.742,
    risk_band: "High",
    threshold: 0.5,
    top_factors: [
      { feature: "Glucose", impact: 0.38, direction: "increases_risk", shap_value: 0.38 },
      { feature: "BMI", impact: 0.26, direction: "increases_risk", shap_value: 0.26 },
      { feature: "Age", impact: 0.18, direction: "increases_risk", shap_value: 0.18 },
      { feature: "Insulin", impact: -0.09, direction: "decreases_risk", shap_value: -0.09 },
      { feature: "BloodPressure", impact: -0.05, direction: "decreases_risk", shap_value: -0.05 },
    ],
    disclaimer: "Demo mode — backend not connected. Results are illustrative only.",
  },
  heart: {
    disease: "heart",
    prediction: 0,
    probability: 0.31,
    risk_band: "Low",
    threshold: 0.5,
    top_factors: [
      { feature: "Cholesterol", impact: 0.22, direction: "increases_risk", shap_value: 0.22 },
      { feature: "Age", impact: 0.15, direction: "increases_risk", shap_value: 0.15 },
      { feature: "MaxHR", impact: -0.18, direction: "decreases_risk", shap_value: -0.18 },
      { feature: "RestingBP", impact: 0.10, direction: "increases_risk", shap_value: 0.10 },
    ],
    disclaimer: "Demo mode — backend not connected. Results are illustrative only.",
  },
};

// Consolidated single-page Analysis flow with three internal states:
//   A. condition selection
//   B. data entry (one unified form)
//   C. results (risk band + SHAP per disease + inline chat)
export default function Analysis() {
  const [state, setState] = useState<State>({ kind: "select" });
  const [loading, setLoading] = useState(false);

  const startEntry = (selected: string[]) =>
    setState({ kind: "entry", selected });

  const selectedConfigs = useMemo(
    () => state.kind === "entry" ? state.selected.map((k) => DISEASES[k]) : [],
    [state]
  );

  const handleSubmit = async (valuesByDisease: Record<string, Record<string, number>>) => {
    if (state.kind !== "entry") return;
    setLoading(true);

    const promises = state.selected.map(async (key) => {
      const cfg = DISEASES[key];
      try {
        const response = await fetch(`/api/v1/predict/${cfg.apiDisease}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(valuesByDisease[key]),
        });

        if (!response.ok) {
          // Backend unreachable or returned an error — use demo data
          console.warn(`Backend returned ${response.status} for ${key} — using demo data`);
          return { key, result: DEMO_RESULTS[key] ?? null, demo: true } as const;
        }

        const result: PredictionResponse = await response.json();
        return { key, result, demo: false } as const;
      } catch {
        // Network error (backend not running) — silently fall back to demo
        console.warn(`Backend unreachable for ${key} — using demo data`);
        return { key, result: DEMO_RESULTS[key] ?? null, demo: true } as const;
      }
    });

    const outcomes = await Promise.all(promises);
    const results: Record<string, PredictionResponse> = {};
    let anyDemo = false;

    for (const outcome of outcomes) {
      if (outcome.result) {
        results[outcome.key] = outcome.result;
        if (outcome.demo) anyDemo = true;
      }
    }

    setLoading(false);
    setState({
      kind: "results",
      selected: state.selected,
      results,
      errors: anyDemo
        ? {} // demo mode — no errors, just show the disclaimer in the result card
        : {},
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-display-lg text-on-surface">Analysis</h1>
        <p className="text-body-base text-on-surface-variant mt-1">
          Assess diabetes and/or heart disease risk from clinical inputs.
        </p>
      </div>

      {state.kind === "select" && (
        <ConditionSelect onContinue={startEntry} />
      )}

      {state.kind === "entry" && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex flex-wrap gap-2">
              {state.selected.map((key) => (
                <span
                  key={key}
                  className="chip bg-surface-container-high text-primary border-outline-variant"
                >
                  {DISEASES[key].title}
                </span>
              ))}
            </div>
            <button
              className="text-label-md text-primary hover:underline flex items-center gap-1"
              onClick={() => setState({ kind: "select" })}
            >
              <Icon name="arrow_back" className="text-[16px]" /> Change conditions
            </button>
          </div>

          <AnalysisForm
            configs={selectedConfigs}
            loading={loading}
            onSubmit={handleSubmit}
          />
        </div>
      )}

      {state.kind === "results" && (
        <div className="space-y-6">
          {/* Top bar: condition chips + edit button */}
          <div className="flex items-center justify-between">
            <div className="flex flex-wrap gap-2">
              {state.selected.map((key) => (
                <span
                  key={key}
                  className="chip bg-surface-container-high text-primary border-outline-variant"
                >
                  {DISEASES[key].title}
                </span>
              ))}
            </div>
            <button
              className="text-label-md text-primary hover:underline flex items-center gap-1"
              onClick={() => setState({ kind: "entry", selected: state.selected })}
            >
              <Icon name="edit" className="text-[16px]" /> Edit inputs
            </button>
          </div>

          {/* Result cards */}
          {state.selected.map((key) => {
            const result = state.results[key];
            if (!result) return null;
            return (
              <div key={key} className="card p-6">
                <h2 className="text-headline-md text-on-surface mb-4">
                  {DISEASES[key].title}
                </h2>
                <RiskResult
                  result={result}
                  positiveLabel={DISEASES[key].resultLabels.positive}
                  negativeLabel={DISEASES[key].resultLabels.negative}
                  simple={key === "heart"}
                />
              </div>
            );
          })}

          {/* Inline chat — always visible below results */}
          <InlineChat
            context={state.selected.map((k) => DISEASES[k].title).join(" & ")}
          />
        </div>
      )}
    </div>
  );
}

function ConditionSelect({ onContinue }: { onContinue: (keys: string[]) => void }) {
  const [selected, setSelected] = useState<string[]>(["diabetes"]);

  function toggle(key: string) {
    setSelected((s) =>
      s.includes(key) ? s.filter((k) => k !== key) : [...s, key]
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {Object.values(DISEASES).map((cfg: DiseaseConfig) => {
          const active = selected.includes(cfg.key);
          return (
            <button
              key={cfg.key}
              onClick={() => toggle(cfg.key)}
              className={`card p-6 text-left transition border-2 ${
                active
                  ? "border-primary bg-surface-container-low"
                  : "border-outline-variant hover:border-primary/40"
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <Icon
                  name={cfg.key === "heart" ? "monitor_heart" : "medical_services"}
                  className="text-[28px] text-primary"
                />
                <span
                  className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                    active ? "bg-primary border-primary text-on-primary" : "border-outline"
                  }`}
                >
                  {active && <Icon name="check" className="text-[14px]" />}
                </span>
              </div>
              <h3 className="text-headline-md text-on-surface">{cfg.title}</h3>
              <p className="text-body-base text-on-surface-variant mt-1">
                {cfg.subtitle}
              </p>
            </button>
          );
        })}
      </div>

      <div className="flex justify-end">
        <button
          className="btn-primary"
          disabled={selected.length === 0}
          onClick={() => onContinue(selected)}
        >
          Continue
          <Icon name="arrow_forward" className="text-[18px]" />
        </button>
      </div>
    </div>
  );
}
