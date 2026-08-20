import type { PredictionResponse } from "../types";
import { RISK_BANDS } from "../config/diseases";
import FactorChart from "../charts/FactorChart";
import Icon from "./Icon";

interface Props {
  result: PredictionResponse;
  positiveLabel: string;
  negativeLabel: string;
  simple?: boolean;
}

// Risk band → display configuration (solid colors, no gradients)
const BAND_CONFIG: Record<
  string,
  { label: string; barColor: string; textColor: string; chipClass: string }
> = {
  High: {
    label: "High",
    barColor: "#dc2626",
    textColor: "text-red-700",
    chipClass: "chip risk-high",
  },
  Moderate: {
    label: "Moderate",
    barColor: "#d97706",
    textColor: "text-amber-700",
    chipClass: "chip risk-mod",
  },
  Low: {
    label: "Low",
    barColor: "#16a34a",
    textColor: "text-green-700",
    chipClass: "chip risk-low",
  },
};

export default function RiskResult({
  result,
  positiveLabel,
  negativeLabel,
  simple = false,
}: Props) {
  const pct = Math.round(result.probability * 100);
  const positive = result.prediction === 1;
  const band = BAND_CONFIG[result.risk_band] ?? BAND_CONFIG.Moderate;
  const thresholdPct = Math.round(result.threshold * 100);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* ── Primary result ──────────────────────────────────────── */}
      <div className="card p-6">
        {/* Risk band + probability */}
        <div className="flex items-start justify-between gap-4 mb-5">
          <div>
            <p className="text-xs text-gray-500 mb-1 font-medium uppercase tracking-wide">
              Risk classification
            </p>
            <div className="flex items-center gap-2.5">
              <span className={band.chipClass}>{band.label} risk</span>
              <span className="text-gray-400 text-xs">
                {positive ? positiveLabel : negativeLabel}
              </span>
            </div>
          </div>
          <div className="text-right shrink-0">
            <p className="text-xs text-gray-500 mb-1">Probability</p>
            <p className={`text-3xl font-semibold font-mono ${band.textColor}`}>
              {pct}%
            </p>
          </div>
        </div>

        {/* Risk bar */}
        <div className="space-y-1.5">
          <div className="relative h-2 bg-gray-100 rounded-full overflow-hidden">
            {/* Threshold marker */}
            <div
              className="absolute top-0 bottom-0 w-px bg-gray-400 z-10"
              style={{ left: `${thresholdPct}%` }}
            />
            {/* Fill */}
            <div
              className="h-full rounded-full transition-all duration-500 ease-out"
              style={{ width: `${pct}%`, backgroundColor: band.barColor }}
            />
          </div>
          <div className="flex justify-between text-[11px] text-gray-400">
            <span>0%</span>
            <span className="flex items-center gap-1">
              <span
                className="w-px h-3 bg-gray-400 inline-block"
                aria-hidden
              />
              Threshold {thresholdPct}%
            </span>
            <span>100%</span>
          </div>
        </div>

        {/* Clinical guidance note */}
        <p className="mt-4 text-sm text-gray-600 leading-relaxed border-t border-gray-100 pt-4">
          {positive
            ? "This result suggests elevated risk. Clinical follow-up and further diagnostic evaluation are recommended."
            : "This result does not indicate elevated risk based on the supplied measurements. Monitoring is still advised."}
        </p>
      </div>

      {/* ── SHAP factor breakdown ────────────────────────────────── */}
      {result.top_factors && result.top_factors.length > 0 && (
        <div className="card p-6">
          <div className="mb-4 pb-3 border-b border-gray-200">
            <h3 className="text-sm font-semibold text-gray-900 mb-1">
              Contributing factors
            </h3>
            <p className="text-xs text-gray-500">
              SHAP values show each measurement's contribution to the final score. Red bars push risk higher; green bars lower it.
            </p>
          </div>

          <FactorChart factors={result.top_factors} />

          <div className="flex items-center gap-5 mt-3 pt-3 border-t border-gray-100 text-xs text-gray-500">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-sm bg-red-500" />
              Increases risk
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-sm bg-green-500" />
              Decreases risk
            </span>
          </div>
        </div>
      )}

      {/* ── Disclaimer ──────────────────────────────────────────── */}
      {result.disclaimer && (
        <p className="text-xs text-gray-400 leading-relaxed flex items-start gap-2">
          <Icon name="info" className="text-[15px] shrink-0 mt-0.5 text-gray-400" />
          {result.disclaimer}
        </p>
      )}

      {/* ── Medical disclaimer ──────────────────────────────────── */}
      <p className="text-xs text-gray-400 leading-relaxed border-t border-gray-200 pt-4">
        This assessment is generated by a machine learning model and is intended for
        clinical decision support only. It does not constitute a medical diagnosis.
        All results should be reviewed by a qualified healthcare professional.
      </p>
    </div>
  );
}
