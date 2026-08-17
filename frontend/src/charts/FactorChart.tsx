import {
  Bar,
  BarChart,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { Factor } from "../types";

interface Props {
  factors: Factor[];
}

// Horizontal bar chart of SHAP impacts, colored by direction.
export default function FactorChart({ factors }: Props) {
  const data = [...factors]
    .sort((a, b) => a.impact - b.impact)
    .map((f) => ({
      feature: f.feature,
      impact: Math.round(f.impact * 1000) / 1000,
      direction: f.direction,
      signed: f.shap_value ?? (f.direction === "increases_risk" ? f.impact : -f.impact),
    }));

  return (
    <ResponsiveContainer width="100%" height={Math.max(180, data.length * 42)}>
      <BarChart
        data={data}
        layout="vertical"
        margin={{ top: 4, right: 16, left: 8, bottom: 4 }}
      >
        <XAxis type="number" hide />
        <YAxis
          type="category"
          dataKey="feature"
          width={140}
          tick={{ fontSize: 12, fill: "#475569" }}
        />
        <Tooltip
          formatter={(_v: number, _n: string, item: any) => [
            `SHAP ${item.payload.signed.toFixed(4)} (${item.payload.direction.replace("_", " ")})`,
            item.payload.feature,
          ]}
          labelStyle={{ color: "#0f172a" }}
        />
        <Bar dataKey="impact" radius={[0, 4, 4, 0]}>
          {data.map((d, i) => (
            <Cell
              key={i}
              fill={d.direction === "increases_risk" ? "#dc2626" : "#16a34a"}
            />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
