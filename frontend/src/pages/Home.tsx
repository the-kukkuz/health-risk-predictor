import { Link } from "react-router-dom";
import Icon from "../components/Icon";

export default function Home() {
  return (
    <div className="space-y-8 animate-fade-in">
      {/* Page header */}
      <div className="page-header">
        <h1 className="text-xl font-bold tracking-tight text-gray-900">Overview</h1>
        <p className="text-sm text-gray-500 mt-1">
          Clinical diabetes and heart disease risk stratification powered by machine learning and SHAP explanations.
        </p>
      </div>

      {/* Risk models */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-400">
            Available Models
          </h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <ModelCard
            to="/analysis?disease=diabetes"
            title="Diabetes Risk Model"
            tag="Scikit-learn"
            inputs="8 clinical inputs"
            description="Evaluates glucose, BMI, blood pressure, insulin, skin thickness, pregnancies, pedigree, and age."
            icon="bloodtype"
            iconBg="bg-blue-50 text-blue-600"
          />
          <ModelCard
            to="/analysis?disease=heart"
            title="Heart Disease Risk Model"
            tag="Gradient Boosting"
            inputs="11 clinical inputs"
            description="Evaluates chest pain type, resting BP, cholesterol, fasting blood sugar, ECG metrics, and max heart rate."
            icon="favorite"
            iconBg="bg-rose-50 text-rose-600"
          />
        </div>
      </section>

      {/* Summary stats */}
      <section>
        <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-3">
          Session Summary
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <StatCard label="Total Assessments" value="1,248" />
          <StatCard label="Avg. Risk Score" value="38.4%" />
          <StatCard label="High Risk Flagged" value="84" highlight />
          <StatCard label="Model Precision" value="94.2%" />
        </div>
      </section>

      {/* Recent assessments */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-400">
            Recent Assessments
          </h2>
          <Link to="/history" className="text-xs font-semibold text-blue-600 hover:text-blue-700 transition-colors">
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
              <HistoryRow disease="Diabetes Risk Model" score="78.4%" band="High" date="Aug 20, 2026" />
              <HistoryRow disease="Heart Disease Model" score="24.0%" band="Low" date="Aug 19, 2026" />
              <HistoryRow disease="Diabetes Risk Model" score="51.2%" band="Moderate" date="Aug 18, 2026" />
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function ModelCard({
  to,
  title,
  tag,
  inputs,
  description,
  icon,
  iconBg,
}: {
  to: string;
  title: string;
  tag: string;
  inputs: string;
  description: string;
  icon: string;
  iconBg: string;
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
            <p className="text-xs text-gray-400 font-medium">
              {tag} · {inputs}
            </p>
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
  label,
  value,
  highlight = false,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div className="bg-white px-4 py-4 rounded-lg border border-gray-200 shadow-sm">
      <p className="text-xs font-medium text-gray-500 mb-1">{label}</p>
      <p className={`text-2xl font-bold tracking-tight ${highlight ? "text-amber-600" : "text-gray-900"}`}>
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
