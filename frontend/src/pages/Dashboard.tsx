import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getModels, getPredictions } from "../services/api";
import type { ModelInfo } from "../types";
import LoadingCard from "../components/LoadingCard";

export default function Dashboard() {
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

  if (loading) return <LoadingCard label="Loading dashboard..." />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Dashboard</h1>
        <p className="text-slate-500 text-sm mt-1">
          Disease risk-stratification models at a glance.
        </p>
      </div>

      {error && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          Could not reach the backend: {error}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard label="Disease modules" value={models.length} />
        <StatCard
          label="Ready modules"
          value={models.filter((m) => m.status === "ready").length}
        />
        <StatCard
          label="Predictions stored"
          value={totalPredictions ?? "—"}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {models.map((m) => (
          <ModuleCard key={m.disease} model={m} />
        ))}
      </div>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="card">
      <p className="text-sm text-slate-500">{label}</p>
      <p className="text-3xl font-bold text-slate-800 mt-1">{value}</p>
    </div>
  );
}

function ModuleCard({ model }: { model: ModelInfo }) {
  const ready = model.status === "ready";
  const link =
    model.disease === "diabetes" ? "/predict/diabetes" : "/predict/heart";
  const recall = (model.test_metrics as any)?.recall;
  const auc = (model.test_metrics as any)?.roc_auc;

  return (
    <div className="card">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold capitalize text-slate-800">
          {model.disease.replace("_", " ")}
        </h3>
        <span
          className={`text-xs font-medium px-2 py-0.5 rounded-full ${
            ready
              ? "bg-green-100 text-green-700"
              : "bg-slate-100 text-slate-600"
          }`}
        >
          {ready ? "Ready" : "Not ready"}
        </span>
      </div>

      {ready ? (
        <div className="mt-3 text-sm text-slate-600 space-y-1">
          <p>
            <span className="text-slate-400">Model:</span>{" "}
            {model.selected_family}
          </p>
          <p>
            <span className="text-slate-400">Version:</span>{" "}
            {model.model_version}
          </p>
          <p>
            <span className="text-slate-400">Threshold:</span>{" "}
            {model.threshold}
          </p>
          {recall !== undefined && (
            <p>
              <span className="text-slate-400">Test recall:</span>{" "}
              <strong>{(recall * 100).toFixed(1)}%</strong>
              <span className="text-slate-400"> · ROC-AUC </span>
              {auc}
            </p>
          )}
        </div>
      ) : (
        <p className="mt-3 text-sm text-slate-500">
          {model.message ||
            "This module is being integrated behind the common API."}
        </p>
      )}

      <Link
        to={link}
        className="inline-block mt-4 text-sm font-medium text-brand-700 hover:underline"
      >
        Open prediction →
      </Link>
    </div>
  );
}
