import { useMemo, useState } from "react";
import { DISEASES } from "../config/diseases";
import type { DiseaseConfig, PredictionResponse } from "../types";
import AnalysisForm from "../components/AnalysisForm";
import RiskResult from "../components/RiskResult";
import RagChat from "../components/RagChat";
import Icon from "../components/Icon";

type State =
  | { kind: "select" }
  | { kind: "entry"; selected: string[] }
  | { kind: "results"; selected: string[]; results: Record<string, PredictionResponse>; errors: Record<string, string> };

// Consolidated single-page Analysis flow with three internal states (no page
// navigation between them):
//   A. condition selection (both selectable, never a hard either/or fork)
//   B. data entry (ONE combined form with ONE submit button)
//   C. results (risk band + SHAP per selected condition, RAG chat available)
export default function Analysis() {
  const [state, setState] = useState<State>({ kind: "select" });

  const startEntry = (selected: string[]) =>
    setState({ kind: "entry", selected });

  // Get configs for selected diseases in order
  const selectedConfigs = useMemo(
    () => state.kind === "entry" ? state.selected.map((k) => DISEASES[k]) : [],
    [state]
  );

  const handleSubmit = async (valuesByDisease: Record<string, Record<string, number>>) => {
    if (state.kind !== "entry") return;

    // Fire parallel predictions for ALL selected diseases.
    const promises = state.selected.map(async (key) => {
      const cfg = DISEASES[key];
      try {
        const response = await fetch(`/api/v1/predict/${cfg.apiDisease}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(valuesByDisease[key]),
        });

        if (!response.ok) {
          const body = await response.json().catch(() => ({}));
          throw new Error(
            body.detail?.message || body.detail || `Prediction failed (${response.status})`
          );
        }

        const result: PredictionResponse = await response.json();
        return { key, result } as const;
      } catch (err) {
        // Return error info so we can show it per-disease
        return { key, error: err instanceof Error ? err.message : "Unknown error" } as const;
      }
    });

    const outcomes = await Promise.all(promises);

    // Separate successes from failures
    const results: Record<string, PredictionResponse> = {};
    const errors: Record<string, string> = {};

    for (const outcome of outcomes) {
      if ("error" in outcome) {
        errors[outcome.key] = outcome.error;
      } else {
        results[outcome.key] = outcome.result;
      }
    }

    setState({
      kind: "results",
      selected: state.selected,
      results,
      errors,
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

          {/* Single unified form for ALL selected diseases */}
          <AnalysisForm
            configs={selectedConfigs}
            loading={false}
            onSubmit={handleSubmit}
          />
        </div>
      )}

      {state.kind === "results" && (
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
              onClick={() => setState({ kind: "entry", selected: state.selected })}
            >
              <Icon name="edit" className="text-[16px]" /> Edit inputs
            </button>
          </div>

          {/* Show results for each disease that succeeded */}
          {state.selected.map((key) => {
            const result = (state as Extract<State, { kind: "results" }>).results[key];
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

          {/* Show errors for diseases that failed */}
          {Object.keys(state.errors).length > 0 && (
            <div className="card p-5 border-error/30 bg-error/5">
              <h3 className="text-headline-sm text-error mb-2">Prediction Errors</h3>
              <ul className="list-disc list-inside space-y-1 text-sm text-on-surface-variant">
                {Object.entries(state.errors).map(([key, msg]) => (
                  <li key={key}>
                    <strong>{DISEASES[key]?.title ?? key}</strong>: {msg}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <RagChat />
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
