import { useState } from "react";
import Icon from "../components/Icon";
import InlineChat from "../components/InlineChat";

interface HistoryItem {
  id: string;
  disease: string;
  band: "High" | "Moderate" | "Low";
  score: string;
  date: string;
  factors: { name: string; impact: number }[];
}

const MOCK: HistoryItem[] = [
  {
    id: "PID-8842-A",
    disease: "Diabetes",
    band: "High",
    score: "87.4%",
    date: "Aug 18, 2026",
    factors: [
      { name: "Glucose", impact: 0.38 },
      { name: "BMI", impact: 0.26 },
      { name: "Age", impact: 0.18 },
      { name: "Insulin", impact: -0.09 },
    ],
  },
  {
    id: "PID-1092-C",
    disease: "Diabetes",
    band: "Moderate",
    score: "45.2%",
    date: "Aug 17, 2026",
    factors: [
      { name: "Glucose", impact: 0.22 },
      { name: "BMI", impact: 0.14 },
      { name: "BloodPressure", impact: -0.06 },
      { name: "Age", impact: 0.12 },
    ],
  },
  {
    id: "PID-7731-M",
    disease: "Diabetes",
    band: "Low",
    score: "12.8%",
    date: "Aug 16, 2026",
    factors: [
      { name: "Glucose", impact: -0.12 },
      { name: "Insulin", impact: -0.08 },
      { name: "BMI", impact: -0.06 },
      { name: "Age", impact: 0.04 },
    ],
  },
  {
    id: "PID-4029-B",
    disease: "Heart Disease",
    band: "Moderate",
    score: "58.1%",
    date: "Aug 15, 2026",
    factors: [
      { name: "Cholesterol", impact: 0.28 },
      { name: "RestingBP", impact: 0.16 },
      { name: "MaxHR", impact: -0.10 },
      { name: "Age", impact: 0.20 },
    ],
  },
  {
    id: "PID-9921-X",
    disease: "Diabetes",
    band: "High",
    score: "91.0%",
    date: "Aug 14, 2026",
    factors: [
      { name: "Glucose", impact: 0.42 },
      { name: "BMI", impact: 0.30 },
      { name: "DiabetesPedigree", impact: 0.18 },
      { name: "Insulin", impact: -0.07 },
    ],
  },
];

const BAND_STYLES = {
  High: {
    chip: "bg-error/10 text-error border-error/20",
    bar: "#ba1a1a",
    badge: "text-error",
    bg: "bg-error/5 border-error/15",
  },
  Moderate: {
    chip: "bg-secondary/10 text-secondary border-secondary/20",
    bar: "#006398",
    badge: "text-secondary",
    bg: "bg-secondary/5 border-secondary/15",
  },
  Low: {
    chip: "bg-tertiary/10 text-tertiary border-tertiary/20",
    bar: "#00501f",
    badge: "text-tertiary",
    bg: "bg-tertiary/5 border-tertiary/15",
  },
};

export default function History() {
  const [query, setQuery] = useState("");
  const [bandFilter, setBandFilter] = useState("");
  const [expanded, setExpanded] = useState<string | null>(null);

  const filtered = MOCK.filter((item) => {
    const matchesQuery =
      item.id.toLowerCase().includes(query.toLowerCase()) ||
      item.disease.toLowerCase().includes(query.toLowerCase());
    const matchesBand = !bandFilter || item.band === bandFilter;
    return matchesQuery && matchesBand;
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-display-lg text-on-surface">Prediction History</h1>
        <p className="text-body-base text-on-surface-variant mt-1">
          Review past clinical risk assessments. Click any row to expand results and chat.
        </p>
      </div>

      {/* Search + filters */}
      <div className="card p-3 flex flex-col lg:flex-row gap-3 items-center">
        <div className="relative w-full lg:max-w-sm flex-grow">
          <Icon name="search" className="absolute left-3 top-1/2 -translate-y-1/2 text-outline-variant text-[20px]" />
          <input
            className="input-field !pl-10"
            placeholder="Search Patient ID or disease..."
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
          <table className="w-full text-left border-collapse min-w-[680px]">
            <thead className="bg-surface-container text-on-surface-variant text-xs font-medium uppercase tracking-wide">
              <tr>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Patient ID</th>
                <th className="px-4 py-3">Disease Module</th>
                <th className="px-4 py-3 text-right">Risk Score</th>
                <th className="px-4 py-3 text-center">Risk Band</th>
                <th className="px-4 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((item) => (
                <HistoryRow
                  key={item.id}
                  item={item}
                  expanded={expanded === item.id}
                  onToggle={() => setExpanded(expanded === item.id ? null : item.id)}
                />
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-body-base text-on-surface-variant">
                    No records match your search.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="bg-surface-container px-4 py-3 border-t border-outline-variant flex items-center justify-between text-on-surface-variant">
          <span className="text-xs">
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
  const styles = BAND_STYLES[item.band];
  const scoreNum = parseFloat(item.score);

  return (
    <>
      {/* Main row */}
      <tr
        className={`border-b border-outline-variant/40 cursor-pointer transition-colors ${
          expanded ? "bg-surface-container-low" : "hover:bg-surface-container-low/60"
        }`}
        onClick={onToggle}
      >
        <td className="px-4 py-3 text-body-base text-on-surface-variant whitespace-nowrap">{item.date}</td>
        <td className="px-4 py-3">
          <span className="text-body-medium text-primary font-mono text-sm">{item.id}</span>
        </td>
        <td className="px-4 py-3 text-body-base text-on-surface">{item.disease}</td>
        <td className="px-4 py-3 text-right">
          <span className={`text-body-medium font-semibold ${styles.badge}`}>{item.score}</span>
        </td>
        <td className="px-4 py-3 text-center">
          <span className={`chip ${styles.chip}`}>{item.band}</span>
        </td>
        <td className="px-4 py-3 text-right">
          <span className="inline-flex items-center gap-1 text-xs font-medium text-primary select-none">
            {expanded ? "Collapse" : "Expand"}
            <Icon
              name={expanded ? "keyboard_arrow_up" : "keyboard_arrow_down"}
              className="text-[18px] transition-transform duration-200"
            />
          </span>
        </td>
      </tr>

      {/* Expanded detail row */}
      {expanded && (
        <tr>
          <td colSpan={6} className="p-0">
            <div className="bg-surface-container-low/60 border-b border-outline-variant px-5 py-5">
              <div className="max-w-4xl space-y-5">
                {/* Result card */}
                <div className={`rounded-xl border p-5 ${styles.bg}`}>
                  <div className="flex items-center justify-between flex-wrap gap-3 mb-4">
                    <div>
                      <p className="text-xs font-medium text-on-surface-variant uppercase tracking-wide">
                        {item.disease} · {item.date}
                      </p>
                      <p className={`text-2xl font-bold mt-0.5 ${styles.badge}`}>
                        {item.band} Risk
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-medium text-on-surface-variant uppercase tracking-wide">
                        Predicted Probability
                      </p>
                      <p className="text-2xl font-bold text-on-surface mt-0.5">{item.score}</p>
                    </div>
                  </div>

                  {/* Score bar */}
                  <div className="w-full h-2.5 bg-surface-container rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{ width: item.score, backgroundColor: styles.bar }}
                    />
                  </div>
                  <div className="flex justify-between text-[10px] text-on-surface-variant mt-1">
                    <span>0%</span>
                    <span>100%</span>
                  </div>
                </div>

                {/* SHAP factors */}
                <div className="card p-4">
                  <h4 className="text-xs font-semibold text-on-surface-variant uppercase tracking-wide mb-3">
                    Top Contributing Factors (SHAP)
                  </h4>
                  <div className="space-y-2">
                    {item.factors.map((f) => (
                      <div key={f.name} className="flex items-center gap-3">
                        <span className="text-xs text-on-surface-variant w-32 text-right shrink-0">
                          {f.name}
                        </span>
                        <div className="flex-1 flex items-center gap-0.5">
                          <div className="flex-1 flex justify-end">
                            {f.impact < 0 && (
                              <div
                                className="h-3 rounded-l-full"
                                style={{
                                  width: `${Math.abs(f.impact) * 200}%`,
                                  backgroundColor: "#00501f",
                                  opacity: 0.85,
                                }}
                              />
                            )}
                          </div>
                          <div className="w-px h-4 bg-outline-variant shrink-0" />
                          <div className="flex-1">
                            {f.impact > 0 && (
                              <div
                                className="h-3 rounded-r-full"
                                style={{
                                  width: `${f.impact * 200}%`,
                                  backgroundColor: "#ba1a1a",
                                  opacity: 0.85,
                                }}
                              />
                            )}
                          </div>
                        </div>
                        <span className={`text-[10px] font-medium w-10 shrink-0 ${
                          f.impact > 0 ? "text-error" : "text-tertiary"
                        }`}>
                          {f.impact > 0 ? "+" : ""}{(f.impact * 100).toFixed(0)}%
                        </span>
                      </div>
                    ))}
                  </div>
                  <div className="flex items-center gap-4 mt-3 pt-3 border-t border-outline-variant">
                    <div className="flex items-center gap-1.5">
                      <div className="w-2.5 h-2.5 rounded-full bg-[#00501f]" />
                      <span className="text-[10px] text-on-surface-variant">Reduces risk</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className="w-2.5 h-2.5 rounded-full bg-error" />
                      <span className="text-[10px] text-on-surface-variant">Increases risk</span>
                    </div>
                  </div>
                </div>

                {/* Inline chat — seeded with this record's context */}
                <InlineChat
                  context={`${item.disease} assessment — ${item.band} Risk, ${item.score} probability (${item.date})`}
                />
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}
