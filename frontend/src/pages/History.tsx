import { useState } from "react";
import Icon from "../components/Icon";

// History: card/table list of past sessions. Expanding a row reopens the full
// results view (design-first: placeholder data, RAG chat included).
interface HistoryItem {
  id: string;
  disease: string;
  band: "High" | "Moderate" | "Low";
  score: string;
  date: string;
}

const MOCK: HistoryItem[] = [
  { id: "PID-8842-A", disease: "Diabetes", band: "High", score: "87.4%", date: "Aug 18, 2026" },
  { id: "PID-1092-C", disease: "Diabetes", band: "Moderate", score: "45.2%", date: "Aug 17, 2026" },
  { id: "PID-7731-M", disease: "Diabetes", band: "Low", score: "12.8%", date: "Aug 16, 2026" },
  { id: "PID-4029-B", disease: "Heart Disease", band: "Moderate", score: "58.1%", date: "Aug 15, 2026" },
  { id: "PID-9921-X", disease: "Diabetes", band: "High", score: "91.0%", date: "Aug 14, 2026" },
];

export default function History() {
  const [query, setQuery] = useState("");
  const [bandFilter, setBandFilter] = useState("");
  const [expanded, setExpanded] = useState<string | null>(null);

  const filtered = MOCK.filter((item) => {
    const matchesQuery = item.id.toLowerCase().includes(query.toLowerCase());
    const matchesBand = !bandFilter || item.band === bandFilter;
    return matchesQuery && matchesBand;
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-display-lg text-on-surface">Prediction History</h1>
        <p className="text-body-base text-on-surface-variant mt-1">
          Review past clinical risk assessments.
        </p>
      </div>

      {/* Search + filters */}
      <div className="card p-3 flex flex-col lg:flex-row gap-3 items-center">
        <div className="relative w-full lg:max-w-sm flex-grow">
          <Icon name="search" className="absolute left-3 top-1/2 -translate-y-1/2 text-outline-variant text-[20px]" />
          <input
            className="input-field !pl-10"
            placeholder="Search Patient ID..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <div className="relative w-full lg:w-48">
          <Icon name="filter_list" className="absolute left-3 top-1/2 -translate-y-1/2 text-outline-variant text-[18px]" />
          <select
            className="select-field !pl-9"
            value={bandFilter}
            onChange={(e) => setBandFilter(e.target.value)}
          >
            <option value="">All Risk Bands</option>
            <option value="High">High Risk</option>
            <option value="Moderate">Moderate Risk</option>
            <option value="Low">Low Risk</option>
          </select>
          <Icon name="arrow_drop_down" className="absolute right-3 top-1/2 -translate-y-1/2 text-outline-variant pointer-events-none text-[18px]" />
        </div>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[700px]">
            <thead className="bg-surface-container font-label-md text-on-surface-variant">
              <tr>
                <th className="p-3 font-medium">Date</th>
                <th className="p-3 font-medium">Patient ID</th>
                <th className="p-3 font-medium">Disease Module</th>
                <th className="p-3 font-medium text-right">Risk Score</th>
                <th className="p-3 font-medium text-center">Risk Band</th>
                <th className="p-3 font-medium text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/50">
              {filtered.map((item) => (
                <HistoryRow
                  key={item.id}
                  item={item}
                  expanded={expanded === item.id}
                  onToggle={() =>
                    setExpanded(expanded === item.id ? null : item.id)
                  }
                />
              ))}
            </tbody>
          </table>
        </div>
        <div className="bg-surface-container px-4 py-3 border-t border-outline-variant flex items-center justify-between text-on-surface-variant">
          <span className="text-body-medium">
            Showing {filtered.length} of {MOCK.length} predictions
          </span>
        </div>
      </div>
    </div>
  );
}

function HistoryRow({
  item,
  expanded,
  onToggle,
}: {
  item: HistoryItem;
  expanded: boolean;
  onToggle: () => void;
}) {
  const chip =
    item.band === "High"
      ? "bg-error/10 text-error border-error/20"
      : item.band === "Moderate"
      ? "bg-secondary/10 text-secondary border-secondary/20"
      : "bg-tertiary/10 text-tertiary border-tertiary/20";

  return (
    <>
      <tr className="hover:bg-surface-container-low transition-colors cursor-pointer" onClick={onToggle}>
        <td className="p-3 text-body-base text-on-surface">{item.date}</td>
        <td className="p-3 text-body-medium text-primary">{item.id}</td>
        <td className="p-3 text-body-base text-on-surface">{item.disease}</td>
        <td className="p-3 text-body-medium text-on-surface text-right">{item.score}</td>
        <td className="p-3 text-center">
          <span className={`chip ${chip}`}>{item.band}</span>
        </td>
        <td className="p-3 text-right">
          <span className="inline-flex items-center gap-1 text-label-md text-primary">
            {expanded ? "Hide" : "View Details"}
            <Icon name={expanded ? "expand_less" : "expand_more"} className="text-[16px]" />
          </span>
        </td>
      </tr>
      {expanded && (
        <tr>
          <td colSpan={6} className="p-5 bg-surface-container-low/40">
            <div className="rounded-lg border border-outline-variant p-5">
              <h4 className="text-headline-sm text-on-surface mb-2">
                {item.disease} — {item.band} Risk
              </h4>
              <p className="text-body-base text-on-surface-variant">
                Full results view (risk band, SHAP factors, RAG chat) will render
                here when the results state is wired. Design-first placeholder.
              </p>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}
