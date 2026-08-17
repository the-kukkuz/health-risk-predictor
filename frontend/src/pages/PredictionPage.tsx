import { useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { DISEASES } from "../config/diseases";
import { NotReadyError, predict } from "../services/api";
import type { PredictionResponse } from "../types";
import PredictionForm from "../components/PredictionForm";
import PredictionResult from "../components/PredictionResult";
import NotReady from "../components/NotReady";
import ErrorAlert from "../components/ErrorAlert";

type State =
  | { kind: "idle" }
  | { kind: "loading" }
  | { kind: "result"; result: PredictionResponse }
  | { kind: "not_ready"; message: string; disease: string }
  | { kind: "error"; message: string };

// Reusable prediction page driven entirely by the disease config. The SAME
// component renders diabetes (live) and heart (placeholder, then live) without
// any disease-specific code paths beyond what the config provides.
export default function PredictionPage() {
  const { disease = "diabetes" } = useParams();
  const config = DISEASES[disease];

  const [state, setState] = useState<State>({ kind: "idle" });

  const isHeartPlaceholder = useMemo(
    () => disease === "heart" && config?.fields.length === 0,
    [disease, config]
  );

  if (!config) {
    return (
      <div className="card">
        <h2 className="text-lg font-semibold">Unknown disease module</h2>
        <p className="text-slate-500 text-sm mt-1">
          No prediction module is configured for "{disease}".
        </p>
      </div>
    );
  }

  async function handleSubmit(values: Record<string, number>) {
    setState({ kind: "loading" });
    try {
      const result = await predict(config.key, values);
      setState({ kind: "result", result });
    } catch (err) {
      if (err instanceof NotReadyError) {
        setState({
          kind: "not_ready",
          message: err.detail.message,
          disease: err.detail.disease,
        });
      } else {
        setState({
          kind: "error",
          message:
            err instanceof Error ? err.message : "Prediction failed.",
        });
      }
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">{config.title}</h1>
        <p className="text-slate-500 text-sm mt-1">{config.subtitle}</p>
      </div>

      {isHeartPlaceholder && state.kind === "idle" ? (
        <NotReady
          message="Heart disease prediction module is currently being integrated."
          disease="heart_disease"
        />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          <div className="lg:col-span-2 card">
            <h2 className="text-base font-semibold text-slate-700 mb-4">
              Patient inputs
            </h2>
            <PredictionForm
              config={config}
              loading={state.kind === "loading"}
              onSubmit={handleSubmit}
            />
          </div>

          <div className="lg:col-span-3 card">
            <h2 className="text-base font-semibold text-slate-700 mb-4">
              Prediction result
            </h2>
            {state.kind === "idle" && (
              <p className="text-sm text-slate-500">
                Fill in the clinical inputs and submit to see the model risk
                estimate and feature-level explanations.
              </p>
            )}
            {state.kind === "loading" && (
              <div className="flex items-center gap-3 text-slate-500 text-sm">
                <span className="inline-block w-4 h-4 border-2 border-slate-300 border-t-brand-600 rounded-full animate-spin" />
                Running model and generating SHAP explanation...
              </div>
            )}
            {state.kind === "result" && (
              <PredictionResult
                result={state.result}
                positiveLabel={config.resultLabels.positive}
                negativeLabel={config.resultLabels.negative}
              />
            )}
            {state.kind === "not_ready" && (
              <NotReady message={state.message} disease={state.disease} />
            )}
            {state.kind === "error" && <ErrorAlert message={state.message} />}
          </div>
        </div>
      )}
    </div>
  );
}
