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
    date: "Aug 20, 2026",
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
    date: "Aug 19, 2026",
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
    date: "Aug 18, 2026",
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
    date: "Aug 17, 2026",
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
    date: "Aug 16, 2026",
    factors: [
      { name: "Glucose", impact: 0.42 },
      { name: "BMI", impact: 0.30 },
      { name: "DiabetesPedigree", impact: 0.18 },
      { name: "Insulin", impact: -0.07 },
    ],
  },
];

const BAND_COLOR: Record<string, { chip: string; bar: string }> = {
  High:     { chip: "chip risk-high", bar: "#dc2626" },
  Moderate: { chip: "chip risk-mod",  bar: "#d97706" },
  Low:      { chip: "chip risk-low",  bar: "#16a34a" },
};

export default function History() {
  const [query, setQuery] = useState("");
  const [bandFilter, setBandFilter] = useState("");
  const [expanded, setExpanded] = useState<string | null>(null);

  const filtered = MOCK.filter((item) => {
    const matchesQuery =
      item.disease.toLowerCase().includes(query.toLowerCase());
    const matchesBand = !bandFilter || item.band === bandFilter;
    return matchesQuery && matchesBand;
  });

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page header */}
      <div className="mb-2">
        <h1 className="text-xl font-bold tracking-tight text-gray-900">History</h1>
        <p className="text-sm text-gray-500 mt-1">
          Your past risk assessments. Select a row to review factors.
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-sm">
          <Icon
            name="search"
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-[18px] pointer-events-none"
          />
          <input
            className="input-field pl-9"
            placeholder="Search by disease…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <select
          className="select-field max-w-[180px]"
          value={bandFilter}
          onChange={(e) => setBandFilter(e.target.value)}
        >
          <option value="">All risk bands</option>
          <option value="High">High</option>
          <option value="Moderate">Moderate</option>
          <option value="Low">Low</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left min-w-[600px]">
            <thead>
              <tr className="border-b border-gray-200/80 bg-gray-50/60">
                <th className="px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Date</th>
                <th className="px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Model</th>
                <th className="px-5 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Score</th>
                <th className="px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Risk Level</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
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
                  <td colSpan={5} className="px-5 py-10 text-center text-gray-400 text-sm">
                    No records match your filter.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="px-5 py-3 border-t border-gray-100 text-xs font-medium text-gray-500 bg-gray-50/50">
          Showing {filtered.length} of {MOCK.length} records
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
  const { chip, bar } = BAND_COLOR[item.band] ?? BAND_COLOR.Moderate;
  const scoreNum = parseFloat(item.score);

  return (
    <>
      <tr
        className={`cursor-pointer transition-colors ${
          expanded ? "bg-blue-50" : "hover:bg-gray-50"
        }`}
        onClick={onToggle}
      >
        <td className="px-4 py-3 text-gray-500 text-sm whitespace-nowrap">{item.date}</td>
        <td className="px-4 py-3 text-gray-900 text-sm">{item.disease}</td>
        <td className="px-4 py-3 text-right font-mono text-sm text-gray-800">{item.score}</td>
        <td className="px-4 py-3">
          <span className={chip}>{item.band}</span>
        </td>
        <td className="px-4 py-3 text-right">
          <Icon
            name={expanded ? "keyboard_arrow_up" : "keyboard_arrow_down"}
            className="text-[18px] text-gray-400"
          />
        </td>
      </tr>

      {/* Expanded detail row */}
      {expanded && (
        <tr>
          <td colSpan={5} className="p-0 bg-gray-50 border-b border-gray-200">
            <div className="px-6 py-5 space-y-6 max-w-2xl">
              {/* Result summary */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <p className="text-sm text-gray-500 mb-1">{item.disease} · {item.date}</p>
                    <div className="flex items-center gap-2">
                      <span className={chip}>{item.band} risk</span>
                    </div>
                  </div>
                  <span className="text-2xl font-semibold font-mono text-gray-900">
                    {item.score}
                  </span>
                </div>
                <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full"
                    style={{ width: `${scoreNum}%`, backgroundColor: bar }}
                  />
                </div>
              </div>

              {/* SHAP factors */}
              <div>
                <p className="text-sm font-medium text-gray-500 mb-3">Contributing factors (SHAP)</p>
                <div className="space-y-2">
                  {item.factors.map((f) => {
                    const isPos = f.impact > 0;
                    const pct = Math.abs(f.impact) * 200;
                    return (
                      <div key={f.name} className="flex items-center gap-3">
                        <span className="text-sm text-gray-500 w-28 shrink-0 text-right">
                          {f.name}
                        </span>
                        <div className="flex-1 flex items-center h-3 gap-px">
                          <div className="flex-1 flex justify-end">
                            {!isPos && (
                              <div
                                className="h-2 bg-green-500 rounded-l-sm"
                                style={{ width: `${pct}%` }}
                              />
                            )}
                          </div>
                          <div className="w-px h-full bg-gray-300 shrink-0" />
                          <div className="flex-1">
                            {isPos && (
                              <div
                                className="h-2 bg-red-500 rounded-r-sm"
                                style={{ width: `${pct}%` }}
                              />
                            )}
                          </div>
                        </div>
                        <span className={`text-sm font-mono w-10 text-right shrink-0 ${
                          isPos ? "text-red-600" : "text-green-600"
                        }`}>
                          {isPos ? "+" : ""}{f.impact.toFixed(2)}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Inline chat */}
              <InlineChat
                context={`${item.disease} — ${item.band} risk, ${item.score} (${item.date})`}
              />
            </div>
          </td>
        </tr>
      )}
    </>
  );
}
