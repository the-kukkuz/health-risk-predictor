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
          console.warn(`Backend returned ${response.status} for ${key} — using demo data`);
          return { key, result: DEMO_RESULTS[key] ?? null, demo: true } as const;
        }

        const result: PredictionResponse = await response.json();
        return { key, result, demo: false } as const;
      } catch {
        console.warn(`Backend unreachable for ${key} — using demo data`);
        return { key, result: DEMO_RESULTS[key] ?? null, demo: true } as const;
      }
    });

    const outcomes = await Promise.all(promises);
    const results: Record<string, PredictionResponse> = {};
    for (const outcome of outcomes) {
      if (outcome.result) results[outcome.key] = outcome.result;
    }

    setLoading(false);
    setState({ kind: "results", selected: state.selected, results, errors: {} });
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page header */}
      <div className="page-header mb-0">
        <h1 className="page-title">Risk Assessment</h1>
        <p className="page-subtitle">
          Enter clinical measurements to compute disease risk probability.
        </p>
      </div>

      {/* Step indicator */}
      <StepBar step={state.kind === "select" ? 1 : state.kind === "entry" ? 2 : 3} />

      {state.kind === "select" && (
        <ConditionSelect onContinue={startEntry} />
      )}

      {state.kind === "entry" && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex flex-wrap gap-2">
              {state.selected.map((key) => (
                <span key={key} className="chip bg-blue-50 text-blue-700 border-blue-200">
                  {DISEASES[key].title}
                </span>
              ))}
            </div>
            <button
              className="btn-ghost text-xs"
              onClick={() => setState({ kind: "select" })}
            >
              <Icon name="arrow_back" className="text-[15px]" />
              Change
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
        <div className="space-y-8">
          {/* Header row */}
          <div className="flex items-center justify-between">
            <div className="flex flex-wrap gap-2">
              {state.selected.map((key) => (
                <span key={key} className="chip bg-blue-50 text-blue-700 border-blue-200">
                  {DISEASES[key].title}
                </span>
              ))}
            </div>
            <button
              className="btn-ghost text-xs"
              onClick={() => setState({ kind: "entry", selected: state.selected })}
            >
              <Icon name="edit" className="text-[15px]" />
              Edit inputs
            </button>
          </div>

          {/* Results */}
          {state.selected.map((key) => {
            const result = state.results[key];
            if (!result) return null;
            return (
              <section key={key}>
                <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">
                  {DISEASES[key].title} result
                </h2>
                <RiskResult
                  result={result}
                  positiveLabel={DISEASES[key].resultLabels.positive}
                  negativeLabel={DISEASES[key].resultLabels.negative}
                  simple={key === "heart"}
                />
              </section>
            );
          })}

          {/* Inline chat */}
          <InlineChat
            context={state.selected.map((k) => DISEASES[k].title).join(" & ")}
          />
        </div>
      )}
    </div>
  );
}

function StepBar({ step }: { step: 1 | 2 | 3 }) {
  const steps = ["Select condition", "Enter measurements", "View results"];
  return (
    <div className="flex items-center gap-0">
      {steps.map((label, i) => {
        const n = i + 1;
        const done = step > n;
        const active = step === n;
        return (
          <div key={label} className="flex items-center">
            <div className="flex items-center gap-2">
              <span
                className={`w-5 h-5 rounded-full text-[11px] font-medium flex items-center justify-center shrink-0 ${
                  done
                    ? "bg-blue-600 text-white"
                    : active
                    ? "bg-blue-600 text-white"
                    : "bg-gray-200 text-gray-500"
                }`}
              >
                {done ? <Icon name="check" className="text-[12px]" /> : n}
              </span>
              <span
                className={`text-xs hidden sm:inline ${
                  active ? "text-gray-900 font-medium" : done ? "text-gray-500" : "text-gray-400"
                }`}
              >
                {label}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div className={`w-8 md:w-14 h-px mx-2 ${done ? "bg-blue-600" : "bg-gray-200"}`} />
            )}
          </div>
        );
      })}
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
      <p className="text-sm text-gray-600">
        Select one or both conditions to assess simultaneously.
      </p>
      <div className="card divide-y divide-gray-200">
        {Object.values(DISEASES).map((cfg: DiseaseConfig) => {
          const active = selected.includes(cfg.key);
          const accentColor = cfg.key === "heart" ? "border-red-500" : "border-blue-500";
          return (
            <button
              key={cfg.key}
              onClick={() => toggle(cfg.key)}
              className={`w-full flex items-start gap-4 px-5 py-4 text-left transition-colors hover:bg-gray-50 ${
                active ? "bg-blue-50 hover:bg-blue-50" : ""
              }`}
            >
              {/* Checkbox */}
              <div
                className={`mt-0.5 w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 transition-colors ${
                  active
                    ? "bg-blue-600 border-blue-600"
                    : "border-gray-300"
                }`}
              >
                {active && <Icon name="check" className="text-white text-[11px]" />}
              </div>
              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span
                    className={`w-1 h-4 rounded-full shrink-0 ${
                      active ? accentColor : "border border-gray-300"
                    } ${active ? "" : "border"}`}
                    style={active ? { backgroundColor: cfg.key === "heart" ? "#ef4444" : "#2563eb" } : {}}
                  />
                  <span className="text-sm font-medium text-gray-900">{cfg.title}</span>
                </div>
                <p className="text-xs text-gray-500 leading-relaxed">{cfg.subtitle}</p>
              </div>
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
          <Icon name="arrow_forward" className="text-[16px]" />
        </button>
      </div>
    </div>
  );
}
