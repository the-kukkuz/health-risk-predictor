import { useEffect, useState } from "react";
import { getModels } from "../services/api";
import type { ModelInfo } from "../types";
import LoadingCard from "../components/LoadingCard";

export default function ModelInfoPage() {
  const [models, setModels] = useState<ModelInfo[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getModels()
      .then(setModels)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingCard label="Loading model information..." />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Model Information</h1>
        <p className="text-slate-500 text-sm mt-1">
          Metadata and validation/test metrics for each registered module.
        </p>
      </div>

      <div className="space-y-4">
        {models.map((m) => (
          <div key={m.disease} className="card">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <h2 className="text-lg font-semibold capitalize text-slate-800">
                {m.disease.replace("_", " ")}
              </h2>
              <span
                className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                  m.status === "ready"
                    ? "bg-green-100 text-green-700"
                    : "bg-slate-100 text-slate-600"
                }`}
              >
                {m.status}
              </span>
            </div>

            {m.status === "ready" ? (
              <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-sm font-semibold text-slate-700 mb-2">
                    Details
                  </h3>
                  <dl className="text-sm space-y-1">
                    <Row k="Model name" v={m.model_name} />
                    <Row k="Version" v={m.model_version} />
                    <Row k="Family" v={m.selected_family} />
                    <Row k="Threshold" v={m.threshold} />
                    <Row k="Features" v={m.feature_names.join(", ")} />
                  </dl>
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-slate-700 mb-2">
                    Test metrics
                  </h3>
                  <MetricsTable metrics={m.test_metrics as any} />
                </div>
              </div>
            ) : (
              <p className="mt-3 text-sm text-slate-500">
                {m.message ||
                  "This module has not been integrated yet. It will appear here automatically when ready."}
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function Row({ k, v }: { k: string; v: string | number | undefined }) {
  return (
    <div className="flex gap-2">
      <dt className="text-slate-400 w-28 shrink-0">{k}</dt>
      <dd className="text-slate-700 break-words">{v ?? "—"}</dd>
    </div>
  );
}

function MetricsTable({ metrics }: { metrics: any }) {
  if (!metrics) return <p className="text-sm text-slate-500">—</p>;
  const order = ["accuracy", "precision", "recall", "f1", "roc_auc"];
  return (
    <table className="text-sm w-full">
      <tbody>
        {order.map((k) => (
          <tr key={k} className="border-b border-slate-100">
            <td className="py-1.5 text-slate-500 capitalize">{k}</td>
            <td className="py-1.5 text-right font-medium text-slate-800">
              {typeof metrics[k] === "number"
                ? k === "roc_auc"
                  ? metrics[k].toFixed(3)
                  : `${(metrics[k] * 100).toFixed(1)}%`
                : "—"}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
