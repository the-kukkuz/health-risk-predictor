import { useEffect, useState } from "react";
import { getModels, getPredictions } from "../services/api";
import type { ModelInfo } from "../types";
import Icon from "../components/Icon";

// Dashboard: two tabs.
//  - Platform Analytics (default): general, non-technical stats for regular users.
//  - Model Analytics: evaluator-facing model metrics (recall/precision/F1/ROC-AUC).
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
    return () => {
      active = false;
    };
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-display-lg text-on-surface">Dashboard</h1>
        <p className="text-body-base text-on-surface-variant mt-1">
          Platform usage and model performance at a glance.
        </p>
      </div>

      {/* Tab switcher */}
      <div className="flex gap-1 border-b border-outline-variant">
        <TabButton active={tab === "platform"} onClick={() => setTab("platform")}>
          <Icon name="dashboard" className="text-[18px]" /> Platform Analytics
        </TabButton>
          <TabButton active={tab === "model"} onClick={() => setTab("model")}>
            <Icon name="bar_chart" className="text-[18px]" /> Model Analytics
        </TabButton>
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

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-4 py-2.5 text-label-md border-b-2 transition ${
        active
          ? "border-primary text-primary font-bold"
          : "border-transparent text-on-surface-variant hover:text-primary"
      }`}
    >
      {children}
    </button>
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
    return <div className="card p-6 text-on-surface-variant text-sm">Loading...</div>;

  return (
    <div className="space-y-6">
      {error && (
        <div className="rounded-lg border border-error/20 bg-error/10 p-4 text-sm text-error">
          Could not reach the backend: {error}
        </div>
      )}

      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard icon="analytics" label="Total Predictions" value={totalPredictions ?? "—"} note="All-time assessments" />
        <StatCard icon="medical_services" label="Active Models" value={readyModules} note="Ready disease modules" />
        <StatCard icon="people" label="Age Groups Tracked" value="6" note="18-24 through 60+" />
      </section>

      <section className="card p-6">
        <h3 className="text-headline-sm text-on-surface mb-4">Assessments by Age Group</h3>
        <div className="flex items-end gap-3 h-48">
          {[
            { label: "18-30", h: 30 },
            { label: "31-40", h: 50 },
            { label: "41-50", h: 80 },
            { label: "51-60", h: 65 },
            { label: "60+", h: 90 },
          ].map((b) => (
            <div key={b.label} className="flex-1 flex flex-col items-center gap-2">
              <div className="w-full bg-primary/40 rounded-t" style={{ height: `${b.h}%` }} />
              <span className="text-caption text-on-surface-variant">{b.label}</span>
            </div>
          ))}
        </div>
      </section>
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
    return <div className="card p-6 text-on-surface-variant text-sm">Loading...</div>;

  const model = models.find((m) => m.disease === disease);

  return (
    <div className="space-y-6">
      {error && (
        <div className="rounded-lg border border-error/20 bg-error/10 p-4 text-sm text-error">
          Could not reach the backend: {error}
        </div>
      )}

      {/* Disease switcher */}
      <div className="flex items-center gap-3">
        <label className="text-label-md text-on-surface-variant">Model</label>
        <select
          className="select-field !w-56"
          value={disease}
          onChange={(e) => setDisease(e.target.value)}
        >
          {models.map((m) => (
            <option key={m.disease} value={m.disease}>
              {m.disease.replace("_", " ")}
            </option>
          ))}
        </select>
      </div>

      {model && model.status === "ready" ? (
        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-headline-sm text-on-surface capitalize">
              {model.disease.replace("_", " ")}
            </h3>
            <span className="chip bg-tertiary/10 text-tertiary border-tertiary/20">
              {model.selected_family}
            </span>
          </div>
          <MetricsGrid metrics={model.test_metrics as any} />
        </div>
      ) : (
        <div className="card p-6 text-on-surface-variant text-sm">
          {model?.message || "This module is not ready yet."}
        </div>
      )}
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  note,
}: {
  icon: string;
  label: string;
  value: string | number;
  note: string;
}) {
  return (
    <div className="card p-5 flex flex-col gap-1">
      <div className="flex items-center justify-between text-on-surface-variant">
        <span className="text-label-md">{label}</span>
        <Icon name={icon} className="text-[18px]" />
      </div>
      <div className="text-display-lg text-on-surface">{value}</div>
      <div className="text-caption text-on-surface-variant">{note}</div>
    </div>
  );
}

function MetricsGrid({ metrics }: { metrics: any }) {
  if (!metrics) return <p className="text-sm text-on-surface-variant">No metrics available.</p>;
  const order = ["accuracy", "precision", "recall", "f1", "roc_auc"];
  const labels: Record<string, string> = {
    accuracy: "Accuracy",
    precision: "Precision",
    recall: "Recall",
    f1: "F1 Score",
    roc_auc: "ROC-AUC",
  };
  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
      {order.map((k) => (
        <div key={k} className="rounded-lg border border-outline-variant p-4">
          <p className="text-label-md text-on-surface-variant">{labels[k]}</p>
          <p className="text-headline-md text-on-surface mt-1">
            {typeof metrics[k] === "number"
              ? k === "roc_auc"
                ? metrics[k].toFixed(3)
                : `${(metrics[k] * 100).toFixed(1)}%`
              : "—"}
          </p>
        </div>
      ))}
    </div>
  );
}
