import {
  Bar,
  BarChart,
  ComposedChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export default function BmiOutcomeChart({
  data,
}: {
  data: { bins: string[]; counts: number[]; diabetes_rate: number[] };
}) {
  const chartData = data.bins.map((b, i) => ({
    bin: b,
    count: data.counts[i],
    rate: Math.round(data.diabetes_rate[i] * 100),
  }));
  return (
    <ResponsiveContainer width="100%" height={220}>
      <ComposedChart data={chartData}>
        <XAxis dataKey="bin" tick={{ fontSize: 11 }} />
        <YAxis yAxisId="left" tick={{ fontSize: 11 }} allowDecimals={false} />
        <YAxis
          yAxisId="right"
          orientation="right"
          tick={{ fontSize: 11 }}
          domain={[0, 100]}
          unit="%"
        />
        <Tooltip />
        <Bar yAxisId="left" dataKey="count" fill="#cbd5e1" radius={[4, 4, 0, 0]} />
        <Line
          yAxisId="right"
          type="monotone"
          dataKey="rate"
          stroke="#dc2626"
          strokeWidth={2}
          dot={{ r: 3 }}
        />
      </ComposedChart>
    </ResponsiveContainer>
  );
}
