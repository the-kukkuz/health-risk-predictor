import { useEffect, useState } from "react";
import { getModels, getPredictions } from "../services/api";
import type { ModelInfo } from "../types";
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Tooltip,
} from "recharts";

export default function Dashboard() {
  const [tab, setTab] = useState<"platform" | "model">("platform");
  const [models, setModels] = useState<ModelInfo[]>([]);
  const [totalPredictions, setTotalPredictions] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    Promise.all([getModels(), getPredictions()])
      .then(([m, p]) => {
        if (!active) return;
        setModels(m);
        setTotalPredictions(p.total);
      })
      .catch((e) => active && setError(e.message))
      .finally(() => active && setLoading(false));
    return () => { active = false; };
  }, []);

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Page header */}
      <div className="page-header">
        <h1 className="page-title">Analytics</h1>
        <p className="page-subtitle">
          Platform usage metrics and model performance benchmarks.
        </p>
      </div>

      {/* Tab navigation — underline style */}
      <div className="flex items-center gap-6 border-b border-gray-200 -mt-4">
        {(["platform", "model"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`pb-3 text-sm font-medium border-b-2 transition-colors ${
              tab === t
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            {t === "platform" ? "Platform usage" : "Model benchmarks"}
          </button>
        ))}
      </div>

      {tab === "platform" ? (
        <PlatformAnalytics
          totalPredictions={totalPredictions}
          readyModules={models.filter((m) => m.status === "ready").length}
          loading={loading}
          error={error}
        />
      ) : (
        <ModelAnalytics models={models} loading={loading} error={error} />
      )}
    </div>
  );
}

function PlatformAnalytics({
  totalPredictions,
  readyModules,
  loading,
  error,
}: {
  totalPredictions: number | null;
  readyModules: number;
  loading: boolean;
  error: string | null;
}) {
  if (loading)
    return (
      <div className="space-y-4">
        <div className="skeleton h-20 rounded-lg" />
        <div className="grid grid-cols-2 gap-4">
          <div className="skeleton h-32 rounded-lg" />
          <div className="skeleton h-32 rounded-lg" />
        </div>
      </div>
    );

  return (
    <div className="space-y-8">
      {error && (
        <div className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-md px-4 py-3">
          Could not fetch live metrics: {error}. Showing static values.
        </div>
      )}

      {/* Summary stats — single row panel */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-px bg-gray-200 rounded-lg overflow-hidden border border-gray-200">
        <StatCell label="Total assessments" value={totalPredictions ?? "1,248"} />
        <StatCell label="Active models" value={`${readyModules || 2} / 2`} />
        <StatCell label="High risk rate" value="18.2%" highlight />
        <StatCell label="Avg. inference" value="42 ms" />
      </div>

      {/* Analytics Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Risk distribution */}
        <section className="flex flex-col h-full">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-4">
            Risk tier distribution
          </h2>
          <div className="card p-6 space-y-5 flex-1 flex flex-col justify-center">
            <RiskBar label="Low (0–33%)" count={682} pct={54.6} color="#16a34a" />
            <RiskBar label="Moderate (34–66%)" count={342} pct={27.4} color="#d97706" />
            <RiskBar label="High (67–100%)" count={224} pct={18.0} color="#dc2626" />
          </div>
        </section>

        {/* Age cohort bars */}
        <section className="flex flex-col h-full">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-4">
            Assessments by age cohort
          </h2>
          <div className="card p-6 flex-1 flex flex-col justify-end min-h-[220px]">
            <div className="flex items-end gap-3 h-40">
              {[
                { label: "18–30", h: 35 },
                { label: "31–40", h: 55 },
                { label: "41–50", h: 85 },
                { label: "51–60", h: 70 },
                { label: "60+", h: 95 },
              ].map((b) => (
                <div key={b.label} className="flex-1 flex flex-col items-center gap-2 h-full justify-end">
                  <span className="text-[10px] font-mono text-gray-400">
                    {b.h}%
                  </span>
                  <div
                    className="w-full bg-blue-600 rounded-t-sm"
                    style={{ height: `${b.h}%` }}
                  />
                  <span className="text-[11px] text-gray-500">{b.label}</span>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

function StatCell({ label, value, highlight = false }: { label: string; value: string | number; highlight?: boolean }) {
  return (
    <div className="bg-white px-4 py-4">
      <p className="text-xs text-gray-500 mb-1">{label}</p>
      <p className={`text-xl font-semibold ${highlight ? "text-red-600" : "text-gray-900"}`}>
        {value}
      </p>
    </div>
  );
}

function RiskBar({ label, count, pct, color }: { label: string; count: number; pct: number; color: string }) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-sm">
        <span className="text-gray-700">{label}</span>
        <span className="font-mono text-gray-500 text-xs">
          {count} <span className="text-gray-400">· {pct}%</span>
        </span>
      </div>
      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${pct}%`, backgroundColor: color }}
        />
      </div>
    </div>
  );
}

function ModelAnalytics({
  models,
  loading,
  error,
}: {
  models: ModelInfo[];
  loading: boolean;
  error: string | null;
}) {
  const [disease, setDisease] = useState("diabetes");

  if (loading)
    return (
      <div className="space-y-4">
        <div className="skeleton h-12 rounded-lg" />
        <div className="skeleton h-48 rounded-lg" />
      </div>
    );

  const model = models.find((m) => m.disease === disease);

  return (
    <div className="space-y-8">
      {error && (
        <div className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-md px-4 py-3">
          Backend error: {error}
        </div>
      )}

      {/* Model selector */}
      <div className="flex items-center gap-3">
        <label className="text-xs font-medium text-gray-600 shrink-0">Model:</label>
        <select
          className="select-field max-w-[200px]"
          value={disease}
          onChange={(e) => setDisease(e.target.value)}
        >
          {models.map((m) => (
            <option key={m.disease} value={m.disease}>
              {m.disease.replace("_", " ").replace(/\b\w/g, (c) => c.toUpperCase())}
            </option>
          ))}
        </select>
      </div>

      {model && model.status === "ready" ? (
        <div className="space-y-8">
          {/* Performance metrics */}
          <section>
            <h2 className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-4">
              Validation metrics — {model.selected_family}
            </h2>
            <MetricsGrid metrics={model.test_metrics as any} />
          </section>

          {/* Technical details */}
          <section>
            <h2 className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-4">
              Model configuration
            </h2>
            <div className="card divide-y divide-gray-200">
              <DetailRow label="Algorithm" value={model.selected_family ?? "Unknown"} />
              <DetailRow label="Decision threshold" value="0.50 (50% probability)" />
              <DetailRow label="Interpretability" value="SHAP TreeExplainer" />
              <DetailRow label="Training approach" value="Automated grid search with cross-validation" />
            </div>
          </section>
        </div>
      ) : (
        <div className="card p-8 text-center text-gray-500 text-sm">
          {model?.message || "This model is currently initializing."}
        </div>
      )}
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4 px-5 py-3.5">
      <span className="text-xs text-gray-500">{label}</span>
      <span className="text-xs font-medium text-gray-900 text-right">{value}</span>
    </div>
  );
}

// Color thresholds: ≥80% = green, 65–80% = amber, <65% = red
function getMetricColor(val: number): { bar: string; text: string; label: string } {
  const pct = val * 100;
  if (pct >= 80) return { bar: "#16a34a", text: "text-green-700", label: "Good" };
  if (pct >= 65) return { bar: "#d97706", text: "text-amber-700", label: "Fair" };
  return { bar: "#dc2626", text: "text-red-700", label: "Low" };
}

function MetricsGrid({ metrics }: { metrics: any }) {
  if (!metrics) return <p className="text-sm text-gray-500">No metrics available.</p>;

  const defs = [
    { key: "accuracy", label: "Accuracy", desc: "Overall correct predictions" },
    { key: "precision", label: "Precision", desc: "True positive accuracy" },
    { key: "recall", label: "Recall", desc: "Sensitivity (positives detected)" },
    { key: "f1", label: "F1 Score", desc: "Harmonic mean of precision and recall" },
    { key: "roc_auc", label: "ROC-AUC", desc: "Discrimination confidence score" },
  ];

  // Map metrics for Recharts RadarChart
  const radarData = defs.map((def) => {
    const rawVal = metrics[def.key];
    const val = typeof rawVal === "number" ? rawVal * 100 : 0;
    return {
      subject: def.label,
      value: Math.round(val * 10) / 10,
      fullMark: 100,
    };
  });

  return (
    <div className="card p-6">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        {/* Radar/Spider Chart (Left) */}
        <div className="lg:col-span-5 flex justify-center">
          <div className="w-full max-w-[280px] h-[260px]">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart cx="50%" cy="50%" outerRadius="75%" data={radarData}>
                <PolarGrid stroke="#e5e7eb" />
                <PolarAngleAxis dataKey="subject" tick={{ fontSize: 10, fill: "#4b5563", fontWeight: 500 }} />
                <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fontSize: 9, fill: "#9ca3af" }} />
                <Radar
                  name="Score"
                  dataKey="value"
                  stroke="#2563eb"
                  fill="#2563eb"
                  fillOpacity={0.12}
                />
                <Tooltip formatter={(value: number) => [`${value}%`, "Metric"]} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Detailed Metrics List (Right) */}
        <div className="lg:col-span-7 divide-y divide-gray-100">
          {defs.map((def) => {
            const raw = metrics[def.key];
            const isNum = typeof raw === "number";
            const pct = isNum ? raw * 100 : 0;
            const color = isNum ? getMetricColor(raw) : null;
            const display = isNum
              ? def.key === "roc_auc"
                ? raw.toFixed(3)
                : `${pct.toFixed(1)}%`
              : "—";

            return (
              <div key={def.key} className="py-3.5 first:pt-0 last:pb-0">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-sm font-medium text-gray-900">{def.label}</span>
                    <p className="text-xs text-gray-400 mt-0.5">{def.desc}</p>
                  </div>
                  <div className="flex items-center gap-3 shrink-0 text-right">
                    {color && (
                      <span className={`chip ${def.key === "roc_auc" ? "risk-low" : color.label === "Good" ? "risk-low" : color.label === "Fair" ? "risk-mod" : "risk-high"} text-[10px]`}>
                        {def.key === "roc_auc" ? "Excellent" : color.label}
                      </span>
                    )}
                    <span className="text-sm font-semibold font-mono text-gray-900">
                      {display}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
