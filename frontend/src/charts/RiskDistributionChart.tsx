import {
  Bar,
  BarChart,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const COLORS: Record<string, string> = {
  Low: "#16a34a",
  Moderate: "#d97706",
  High: "#dc2626",
};

export default function RiskDistributionChart({
  data,
}: {
  data: { labels: string[]; counts: number[] };
}) {
  const chartData = data.labels.map((l, i) => ({ label: l, count: data.counts[i] }));
  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={chartData}>
        <XAxis dataKey="label" tick={{ fontSize: 12 }} />
        <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
        <Tooltip />
        <Bar dataKey="count" radius={[4, 4, 0, 0]}>
          {chartData.map((d, i) => (
            <Cell key={i} fill={COLORS[d.label] ?? "#64748b"} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
