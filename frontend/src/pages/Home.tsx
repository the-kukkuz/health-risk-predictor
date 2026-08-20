import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import Icon from "../components/Icon";
import { DISEASES } from "../config/diseases";

// ─── API shapes ───────────────────────────────────────────────────────────────

interface PredictionRecord {
  id: number;
  disease_type: string;
  probability: number;
  risk_band: "High" | "Moderate" | "Low";
  created_at: string | null;
}

interface ModelMeta {
  disease: string;
  selected_family: string | null;
  test_metrics: Record<string, number> | null;
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function Home() {
  const [predictions, setPredictions] = useState<PredictionRecord[]>([]);
  const [total, setTotal] = useState<number | null>(null);
  const [models, setModels] = useState<ModelMeta[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const [predsRes, modelsRes] = await Promise.all([
          fetch("/api/v1/predictions?limit=500"),
          fetch("/api/v1/models"),
        ]);

        if (cancelled) return;

        if (predsRes.ok) {
          const data = await predsRes.json();
          setPredictions(data.items ?? []);
          setTotal(data.total ?? 0);
        }

        if (modelsRes.ok) {
          setModels(await modelsRes.json());
        }
      } catch {
        // silently fall through — empty state shown below
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, []);

  // ── Computed stats ────────────────────────────────────────────────────────

  const totalAssessments = total ?? 0;

  const avgRiskScore =
    predictions.length > 0
      ? (predictions.reduce((s, p) => s + p.probability * 100, 0) / predictions.length).toFixed(1) + "%"
      : "—";

  const highRiskCount = predictions.filter((p) => p.risk_band === "High").length;

  const diabetesMeta = models.find((m) => m.disease === "diabetes");
  const heartMeta    = models.find((m) => m.disease === "heart");

  const precisionRaw = diabetesMeta?.test_metrics?.["precision"];
  const precision    = precisionRaw != null ? (precisionRaw * 100).toFixed(1) + "%" : "—";

  // Model tags: from API if available, else sensible defaults
  const diabetesTag = diabetesMeta?.selected_family ?? "Scikit-learn";
  const heartTag    = heartMeta?.selected_family    ?? "Gradient Boosting";

  // Input counts: single source of truth from DISEASES config
  const diabetesInputCount = DISEASES.diabetes.fields.length;
  const heartInputCount    = DISEASES.heart.fields.length;

  // Recent 3 assessments (already ordered newest-first by API)
  const recent = predictions.slice(0, 3);

  // ── Helpers ───────────────────────────────────────────────────────────────

  function formatDate(iso: string | null) {
    if (!iso) return "—";
    return new Date(iso).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  }

  function formatDisease(disease_type: string) {
    if (disease_type === "diabetes") return "Diabetes Risk Model";
    if (disease_type === "heart")    return "Heart Disease Model";
    return disease_type;
  }

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-8 animate-fade-in">

      {/* Page header */}
      <div className="page-header">
        <h1 className="text-xl font-bold tracking-tight text-gray-900">Overview</h1>
        <p className="text-sm text-gray-500 mt-1">
          Clinical diabetes and heart disease risk stratification powered by machine learning and SHAP explanations.
        </p>
      </div>

      {/* Available models */}
      <section>
        <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-3">
          Available Models
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <ModelCard
            to="/analysis?disease=diabetes"
            title="Diabetes Risk Model"
            tag={diabetesTag}
            inputs={`${diabetesInputCount} clinical inputs`}
            description="Evaluates glucose, BMI, blood pressure, insulin, skin thickness, pregnancies, pedigree, and age."
            icon="bloodtype"
            iconBg="bg-blue-50 text-blue-600"
          />
          <ModelCard
            to="/analysis?disease=heart"
            title="Heart Disease Risk Model"
            tag={heartTag}
            inputs={`${heartInputCount} clinical inputs`}
            description="Evaluates chest pain type, resting BP, cholesterol, fasting blood sugar, ECG metrics, and max heart rate."
            icon="favorite"
            iconBg="bg-rose-50 text-rose-600"
          />
        </div>
      </section>

      {/* Session summary */}
      <section>
        <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-3">
          Session Summary
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <StatCard label="Total Assessments"  value={loading ? null : totalAssessments.toLocaleString()} />
          <StatCard label="Avg. Risk Score"    value={loading ? null : avgRiskScore} />
          <StatCard label="High Risk Flagged"  value={loading ? null : String(highRiskCount)} highlight />
          <StatCard label="Model Precision"    value={loading ? null : precision} />
        </div>
      </section>

      {/* Recent assessments */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-400">
            Recent Assessments
          </h2>
          <Link
            to="/history"
            className="text-xs font-semibold text-blue-600 hover:text-blue-700 transition-colors"
          >
            View history →
          </Link>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
          <table className="w-full text-sm text-left">
            <thead>
              <tr className="border-b border-gray-200/80 bg-gray-50/60">
                <th className="px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Model</th>
                <th className="px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Risk Score</th>
                <th className="px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Risk Level</th>
                <th className="px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                [1, 2, 3].map((i) => (
                  <tr key={i}>
                    <td className="px-5 py-3.5"><div className="skeleton h-4 w-36" /></td>
                    <td className="px-5 py-3.5"><div className="skeleton h-4 w-12" /></td>
                    <td className="px-5 py-3.5"><div className="skeleton h-4 w-16" /></td>
                    <td className="px-5 py-3.5"><div className="skeleton h-4 w-20" /></td>
                  </tr>
                ))
              ) : recent.length > 0 ? (
                recent.map((r) => (
                  <HistoryRow
                    key={r.id}
                    disease={formatDisease(r.disease_type)}
                    score={`${(r.probability * 100).toFixed(1)}%`}
                    band={r.risk_band}
                    date={formatDate(r.created_at)}
                  />
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="px-5 py-8 text-center text-sm text-gray-400">
                    No assessments yet — run your first assessment to see results here.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function ModelCard({
  to, title, tag, inputs, description, icon, iconBg,
}: {
  to: string; title: string; tag: string; inputs: string;
  description: string; icon: string; iconBg: string;
}) {
  return (
    <div className="bg-white p-5 rounded-lg border border-gray-200 shadow-sm hover:border-gray-300 transition-all flex flex-col justify-between group">
      <div>
        <div className="flex items-center gap-3 mb-3">
          <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${iconBg}`}>
            <Icon name={icon} className="text-[18px]" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
              {title}
            </h3>
            <p className="text-xs text-gray-400 font-medium">{tag} · {inputs}</p>
          </div>
        </div>
        <p className="text-xs text-gray-500 leading-relaxed mb-4">{description}</p>
      </div>
      <div className="flex justify-end pt-2 border-t border-gray-100">
        <Link
          to={to}
          className="btn-primary text-xs py-1.5 px-3.5 rounded-md font-semibold inline-flex items-center gap-1.5"
        >
          Run Assessment
          <Icon name="arrow_forward" className="text-[14px]" />
        </Link>
      </div>
    </div>
  );
}

function StatCard({
  label, value, highlight = false,
}: {
  label: string; value: string | null; highlight?: boolean;
}) {
  return (
    <div className="bg-white px-4 py-4 rounded-lg border border-gray-200 shadow-sm">
      <p className="text-xs font-medium text-gray-500 mb-2">{label}</p>
      {value === null ? (
        <div className="skeleton h-8 w-24" />
      ) : (
        <p className={`text-2xl font-bold tracking-tight ${highlight ? "text-amber-600" : "text-gray-900"}`}>
          {value}
        </p>
      )}
    </div>
  );
}

function HistoryRow({
  disease, score, band, date,
}: {
  disease: string; score: string; band: "High" | "Moderate" | "Low"; date: string;
}) {
  const chipClass =
    band === "High"
      ? "bg-rose-50 text-rose-700 border-rose-200/60"
      : band === "Moderate"
      ? "bg-amber-50 text-amber-700 border-amber-200/60"
      : "bg-emerald-50 text-emerald-700 border-emerald-200/60";

  return (
    <tr className="hover:bg-gray-50/50 transition-colors">
      <td className="px-5 py-3.5 text-gray-900 font-medium">{disease}</td>
      <td className="px-5 py-3.5 font-semibold text-gray-800">{score}</td>
      <td className="px-5 py-3.5">
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${chipClass}`}>
          {band}
        </span>
      </td>
      <td className="px-5 py-3.5 text-gray-400 text-xs font-medium">{date}</td>
    </tr>
  );
}
