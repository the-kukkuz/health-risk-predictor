import { useState, useEffect } from "react";
import Icon from "../components/Icon";
import InlineChat from "../components/InlineChat";

// ─── API shape ────────────────────────────────────────────────────────────────

interface PredictionRecord {
  id: number;
  disease_type: string;
  model_version: string;
  probability: number;
  risk_band: "High" | "Moderate" | "Low";
  created_at: string | null;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const BAND_COLOR: Record<string, { chip: string; bar: string }> = {
  High:     { chip: "chip risk-high", bar: "#dc2626" },
  Moderate: { chip: "chip risk-mod",  bar: "#d97706" },
  Low:      { chip: "chip risk-low",  bar: "#16a34a" },
};

function formatDate(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatDisease(disease_type: string) {
  if (disease_type === "diabetes") return "Diabetes";
  if (disease_type === "heart")    return "Heart Disease";
  // capitalise first letter as fallback
  return disease_type.charAt(0).toUpperCase() + disease_type.slice(1);
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function History() {
  const [records, setRecords]     = useState<PredictionRecord[]>([]);
  const [total, setTotal]         = useState(0);
  const [loading, setLoading]       = useState(true);
  const [diseaseFilter, setDiseaseFilter] = useState("");
  const [bandFilter, setBandFilter]  = useState("");
  const [expanded, setExpanded]      = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const res = await fetch("/api/v1/predictions?limit=200");
        if (!cancelled && res.ok) {
          const data = await res.json();
          setRecords(data.items ?? []);
          setTotal(data.total ?? 0);
        }
      } catch {
        // silently fail — empty state shown below
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, []);

  // ── Filter ────────────────────────────────────────────────────────────────

  const filtered = records.filter((r) => {
    const matchesDisease = !diseaseFilter || r.disease_type === diseaseFilter;
    const matchesBand    = !bandFilter    || r.risk_band    === bandFilter;
    return matchesDisease && matchesBand;
  });

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page header */}
      <div className="mb-2">
        <h1 className="text-xl font-bold tracking-tight text-gray-900">History</h1>
        <p className="text-sm text-gray-500 mt-1">
          Your past risk assessments. Select a row to review details.
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <select
          className="select-field max-w-[200px]"
          value={diseaseFilter}
          onChange={(e) => { setDiseaseFilter(e.target.value); setExpanded(null); }}
        >
          <option value="">All diseases</option>
          <option value="diabetes">Diabetes</option>
          <option value="heart">Heart Disease</option>
        </select>
        <select
          className="select-field max-w-[180px]"
          value={bandFilter}
          onChange={(e) => { setBandFilter(e.target.value); setExpanded(null); }}
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
                <th className="px-5 py-3 w-36 text-xs font-semibold text-gray-500 uppercase tracking-wider">Date</th>
                <th className="px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Model</th>
                <th className="px-5 py-3 w-28 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Score</th>
                <th className="px-5 py-3 w-32 text-xs font-semibold text-gray-500 uppercase tracking-wider">Risk Level</th>
                <th className="px-5 py-3 w-10" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                // Skeleton rows
                [1, 2, 3, 4, 5].map((i) => (
                  <tr key={i}>
                    <td className="px-5 py-3.5"><div className="skeleton h-4 w-28" /></td>
                    <td className="px-5 py-3.5"><div className="skeleton h-4 w-24" /></td>
                    <td className="px-5 py-3.5 text-right"><div className="skeleton h-4 w-12 ml-auto" /></td>
                    <td className="px-5 py-3.5"><div className="skeleton h-4 w-16" /></td>
                    <td className="px-5 py-3.5" />
                  </tr>
                ))
              ) : filtered.length > 0 ? (
                filtered.map((record) => (
                  <HistoryRow
                    key={record.id}
                    record={record}
                    expanded={expanded === record.id}
                    onToggle={() => setExpanded(expanded === record.id ? null : record.id)}
                  />
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="px-5 py-10 text-center text-gray-400 text-sm">
                    {records.length === 0
                      ? "No assessments yet — run your first assessment to see it here."
                      : "No records match your filter."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-gray-100 text-xs font-medium text-gray-500 bg-gray-50/50">
          {loading
            ? "Loading records…"
            : `Showing ${filtered.length} of ${total} records`}
        </div>
      </div>
    </div>
  );
}

// ─── HistoryRow ───────────────────────────────────────────────────────────────

function HistoryRow({
  record,
  expanded,
  onToggle,
}: {
  record: PredictionRecord;
  expanded: boolean;
  onToggle: () => void;
}) {
  const { chip, bar } = BAND_COLOR[record.risk_band] ?? BAND_COLOR.Moderate;
  const scorePct = Math.round(record.probability * 100);
  const diseaseLabel = formatDisease(record.disease_type);
  const dateLabel    = formatDate(record.created_at);

  return (
    <>
      <tr
        className={`cursor-pointer transition-colors ${
          expanded ? "bg-blue-50" : "hover:bg-gray-50"
        }`}
        onClick={onToggle}
      >
        <td className="px-4 py-3 w-36 text-gray-600 text-sm font-medium whitespace-nowrap">{dateLabel}</td>
        <td className="px-4 py-3 text-gray-900 text-sm font-medium">{diseaseLabel}</td>
        <td className="px-4 py-3 w-28 text-right font-mono text-sm text-gray-800">{scorePct}%</td>
        <td className="px-4 py-3 w-32">
          <span className={chip}>{record.risk_band}</span>
        </td>
        <td className="px-4 py-3 w-10 text-right">
          <Icon
            name={expanded ? "keyboard_arrow_up" : "keyboard_arrow_down"}
            className="text-[18px] text-gray-400"
          />
        </td>
      </tr>

      {/* Expanded detail row */}
      {expanded && (
        <tr>
          <td colSpan={5} className="p-0 bg-blue-50/40 border-b border-blue-100">
            <div className="px-6 py-5">
              {/* Result summary */}
              <div className="flex items-center gap-6 mb-5">
                <div className="flex-1">
                  <p className="text-xs text-gray-500 mb-1">{diseaseLabel} · {dateLabel}</p>
                  <div className="flex items-center gap-2">
                    <span className={chip}>{record.risk_band} risk</span>
                  </div>
                </div>
                <div className="flex-[2]">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs text-gray-500">Risk score</span>
                    <span className="text-sm font-semibold font-mono text-gray-900">{scorePct}%</span>
                  </div>
                  <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{ width: `${scorePct}%`, backgroundColor: bar }}
                    />
                  </div>
                </div>
              </div>

              {/* Inline chat */}
              <InlineChat
                context={`${diseaseLabel} — ${record.risk_band} risk, ${scorePct}% (${dateLabel})`}
              />
            </div>
          </td>
        </tr>
      )}
    </>
  );
}
