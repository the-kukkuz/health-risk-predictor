import {
  Bar,
  BarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export default function AgeDistributionChart({
  data,
}: {
  data: { bins: string[]; counts: number[] };
}) {
  const chartData = data.bins.map((b, i) => ({ bin: b, count: data.counts[i] }));
  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={chartData}>
        <XAxis dataKey="bin" tick={{ fontSize: 10 }} interval={0} angle={-20} textAnchor="end" height={50} />
        <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
        <Tooltip />
        <Bar dataKey="count" fill="#2563eb" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
