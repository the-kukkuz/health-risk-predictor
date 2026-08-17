import {
  Bar,
  BarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export default function FeatureImportanceChart({
  data,
}: {
  data: { features: string[]; values: number[] };
}) {
  const chartData = data.features
    .map((f, i) => ({ feature: f, value: data.values[i] }))
    .sort((a, b) => b.value - a.value);
  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={chartData}>
        <XAxis
          dataKey="feature"
          tick={{ fontSize: 10 }}
          interval={0}
          angle={-30}
          textAnchor="end"
          height={60}
        />
        <YAxis tick={{ fontSize: 12 }} />
        <Tooltip formatter={(v: number) => v.toFixed(4)} />
        <Bar dataKey="value" fill="#0ea5e9" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
