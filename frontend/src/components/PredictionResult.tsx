import type { PredictionResponse } from "../types";
import { RISK_BANDS } from "../config/diseases";
import FactorChart from "../charts/FactorChart";

interface Props {
  result: PredictionResponse;
  positiveLabel: string;
  negativeLabel: string;
}

export default function PredictionResult({
  result,
  positiveLabel,
  negativeLabel,
}: Props) {
  const band = RISK_BANDS[result.risk_band] ?? RISK_BANDS.Moderate;
  const pct = Math.round(result.probability * 100);

  return (
    <div className="space-y-5">
      <div className={`rounded-xl border p-5 ${band.bgColor}`}>
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <p className="text-sm font-medium text-slate-600">
              Model risk band
            </p>
            <p className={`text-2xl font-bold ${band.textColor}`}>
              {band.label}
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm font-medium text-slate-600">
              Predicted probability
            </p>
            <p className="text-2xl font-bold text-slate-800">{pct}%</p>
          </div>
        </div>

        <div className="mt-4">
          <div className="h-3 w-full rounded-full bg-slate-200 overflow-hidden">
            <div
              className="h-full rounded-full transition-all"
              style={{ width: `${pct}%`, backgroundColor: band.color }}
            />
          </div>
          <div className="flex justify-between text-[11px] text-slate-500 mt-1">
            <span>0%</span>
            <span>
              threshold @ {Math.round(result.threshold * 100)}%
            </span>
            <span>100%</span>
          </div>
        </div>

        <p className={`mt-3 text-sm font-semibold ${band.textColor}`}>
          {result.prediction === 1 ? positiveLabel : negativeLabel}
        </p>
        <p className="mt-1 text-xs text-slate-600">
          Risk bands are model-defined categories, not clinical diagnoses.
        </p>
      </div>

      <div>
        <h3 className="text-sm font-semibold text-slate-700 mb-2">
          Top contributing features (SHAP)
        </h3>
        <p className="text-xs text-slate-500 mb-3">
          These features contributed to the model prediction. They do not imply
          causation.
        </p>
        <FactorChart factors={result.top_factors} />
      </div>

      {result.disclaimer && (
        <p className="text-xs text-slate-500 leading-relaxed border-t pt-3">
          {result.disclaimer}
        </p>
      )}
    </div>
  );
}
