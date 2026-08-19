import { Link } from "react-router-dom";
import Icon from "../components/Icon";

// Home: platform overview, "Start Assessment" CTA, recent history preview.
// Design-first: stat values are illustrative placeholders to be wired later.
export default function Home() {
  return (
    <div className="flex flex-col gap-8">
      {/* Welcome banner */}
      <section className="card p-6 flex items-center justify-between overflow-hidden relative">
        <div className="relative z-10">
          <h1 className="text-display-lg text-on-surface">
            Welcome back
          </h1>
          <p className="text-body-base text-on-surface-variant mt-1">
            Estimate diabetes and heart disease risk from clinical inputs using
            explainable machine-learning models.
          </p>
          <Link
            to="/analysis"
            className="btn-primary mt-5"
          >
            <Icon name="add" className="text-[18px]" />
            Start Assessment
          </Link>
        </div>
        <div className="hidden sm:block text-primary opacity-20">
          <Icon name="health_and_safety" className="text-[120px]" />
        </div>
      </section>

      {/* Platform stats */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard icon="analytics" label="Total Predictions" value="1,248" note="+12% from last month" />
        <StatCard icon="percent" label="Avg. Risk Probability" value="42.5%" note="Stable across cohorts" />
        <StatCard
          icon="warning"
          label="High Risk Alerts"
          value="84"
          note="Requires immediate review"
          alert
        />
      </section>

      {/* Recent history preview */}
      <section className="card overflow-hidden">
        <div className="px-5 py-4 border-b border-outline-variant bg-surface-container-low/50 flex items-center justify-between">
          <h3 className="text-headline-sm text-on-surface">Recent Assessments</h3>
          <Link
            to="/history"
            className="text-label-md text-primary hover:underline"
          >
            View All
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-surface-container font-label-md text-on-surface-variant">
              <tr>
                <th className="p-3 font-medium">Disease</th>
                <th className="p-3 font-medium">Risk Band</th>
                <th className="p-3 font-medium">Date</th>
                <th className="p-3 font-medium text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/50">
              <HistoryRow disease="Diabetes" band="High" date="Aug 18, 2026" />
              <HistoryRow disease="Diabetes" band="Low" date="Aug 17, 2026" />
              <HistoryRow disease="Heart Disease" band="Moderate" date="Aug 16, 2026" />
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  note,
  alert = false,
}: {
  icon: string;
  label: string;
  value: string;
  note: string;
  alert?: boolean;
}) {
  return (
    <div className="card p-5 flex flex-col gap-1">
      <div
        className={`flex items-center justify-between ${
          alert ? "text-error" : "text-on-surface-variant"
        }`}
      >
        <span className="text-label-md">{label}</span>
        <Icon name={icon} className="text-[18px]" />
      </div>
      <div className={`text-display-lg ${alert ? "text-error" : "text-on-surface"}`}>
        {value}
      </div>
      <div className={`text-caption ${alert ? "text-error" : "text-on-surface-variant"}`}>
        {note}
      </div>
    </div>
  );
}

function HistoryRow({
  disease,
  band,
  date,
}: {
  disease: string;
  band: "High" | "Moderate" | "Low";
  date: string;
}) {
  const chip =
    band === "High"
      ? "bg-error/10 text-error border-error/20"
      : band === "Moderate"
      ? "bg-secondary/10 text-secondary border-secondary/20"
      : "bg-tertiary/10 text-tertiary border-tertiary/20";
  return (
    <tr className="hover:bg-surface-container-low transition-colors">
      <td className="p-3 text-body-base text-on-surface">{disease}</td>
      <td className="p-3">
        <span className={`chip ${chip}`}>{band}</span>
      </td>
      <td className="p-3 text-body-base text-on-surface-variant">{date}</td>
      <td className="p-3 text-right">
        <Link to="/history" className="text-label-md text-primary hover:underline">
          View Details
        </Link>
      </td>
    </tr>
  );
}
