import { Link } from "react-router-dom";
import Icon from "../components/Icon";

export default function Home() {
  return (
    <div className="space-y-10 animate-fade-in">
      {/* Page header */}
      <div className="page-header">
        <h1 className="page-title">Overview</h1>
        <p className="page-subtitle">
          Diabetes and heart disease risk assessment with SHAP factor explanations.
        </p>
      </div>

      {/* Risk models */}
      <section>
        <h2 className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-3">
          Available models
        </h2>
        <div className="card divide-y divide-gray-200">
          <ModelRow
            to="/analysis?disease=diabetes"
            title="Diabetes Risk Model"
            meta="Scikit-learn · 8 clinical inputs"
            description="Glucose, BMI, blood pressure, insulin, skin thickness, pregnancies, pedigree, and age."
            accent="bg-blue-600"
          />
          <ModelRow
            to="/analysis?disease=heart"
            title="Heart Disease Risk Model"
            meta="Gradient Boosting · 11 clinical inputs"
            description="Chest pain type, resting BP, cholesterol, fasting blood sugar, ECG results, max heart rate, angina, and ST metrics."
            accent="bg-red-600"
          />
        </div>
      </section>

      {/* Summary stats */}
      <section>
        <h2 className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-3">
          Session summary
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-px bg-gray-200 rounded-lg overflow-hidden border border-gray-200">
          <StatCell label="Total assessments" value="1,248" />
          <StatCell label="Avg. risk score" value="38.4%" />
          <StatCell label="High risk flagged" value="84" highlight />
          <StatCell label="Model precision" value="94.2%" />
        </div>
      </section>

      {/* Recent assessments */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-gray-400">
            Recent assessments
          </h2>
          <Link to="/history" className="text-xs text-blue-600 hover:text-blue-700 font-medium">
            View all
          </Link>
        </div>

        <div className="card overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Model</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Risk score</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Band</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              <HistoryRow disease="Diabetes" score="78.4%" band="High" date="Aug 20, 2026" />
              <HistoryRow disease="Heart Disease" score="24.0%" band="Low" date="Aug 19, 2026" />
              <HistoryRow disease="Diabetes" score="51.2%" band="Moderate" date="Aug 18, 2026" />
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function ModelRow({
  to,
  title,
  meta,
  description,
  accent,
}: {
  to: string;
  title: string;
  meta: string;
  description: string;
  accent: string;
}) {
  return (
    <div className="flex items-start gap-4 px-5 py-4 hover:bg-gray-50 transition-colors group">
      <div className={`w-1 self-stretch rounded-full ${accent} shrink-0 mt-0.5`} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <span className="text-sm font-medium text-gray-900">{title}</span>
          <span className="text-xs text-gray-400">{meta}</span>
        </div>
        <p className="text-xs text-gray-500 leading-relaxed">{description}</p>
      </div>
      <Link
        to={to}
        className="btn-primary text-xs py-1.5 px-3 shrink-0 self-start opacity-0 group-hover:opacity-100 transition-opacity"
      >
        Run
        <Icon name="arrow_forward" className="text-[14px]" />
      </Link>
    </div>
  );
}

function StatCell({
  label,
  value,
  highlight = false,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div className="bg-white px-4 py-4">
      <p className="text-xs text-gray-500 mb-1">{label}</p>
      <p className={`text-xl font-semibold ${highlight ? "text-amber-600" : "text-gray-900"}`}>
        {value}
      </p>
    </div>
  );
}

function HistoryRow({
  disease,
  score,
  band,
  date,
}: {
  disease: string;
  score: string;
  band: "High" | "Moderate" | "Low";
  date: string;
}) {
  const chipClass =
    band === "High"
      ? "chip risk-high"
      : band === "Moderate"
      ? "chip risk-mod"
      : "chip risk-low";

  return (
    <tr className="hover:bg-gray-50 transition-colors">
      <td className="px-4 py-3 text-gray-900">{disease}</td>
      <td className="px-4 py-3 font-mono text-gray-800">{score}</td>
      <td className="px-4 py-3">
        <span className={chipClass}>{band}</span>
      </td>
      <td className="px-4 py-3 text-gray-400">{date}</td>
    </tr>
  );
}
