import type { PredictionResponse } from "../types";
import { RISK_BANDS } from "../config/diseases";
import FactorChart from "../charts/FactorChart";
import Icon from "./Icon";

interface Props {
  result: PredictionResponse;
  positiveLabel: string;
  negativeLabel: string;
  // Heart disease returns a simple Yes/No; diabetes uses a risk band.
  simple?: boolean;
}

// Renders a single disease's prediction result. For diabetes it shows the
// model-defined risk band + probability meter; for heart it shows a Yes/No
// verdict (severity/risk-band conversion is future work).
export default function RiskResult({
  result,
  positiveLabel,
  negativeLabel,
  simple = false,
}: Props) {
  const pct = Math.round(result.probability * 100);
  const positive = result.prediction === 1;

  if (simple) {
    return (
      <div className="space-y-5">
        <div
          className={`rounded-xl border p-5 ${
            positive ? "bg-error/10 border-error/20" : "bg-tertiary/10 border-tertiary/20"
          }`}
        >
          <div className="flex items-center gap-3">
            <Icon
              name={positive ? "warning" : "check_circle"}
              className={`text-[32px] ${positive ? "text-error" : "text-tertiary"}`}
              filled
            />
            <div>
              <p className="text-label-md text-on-surface-variant">Heart disease risk</p>
              <p
                className={`text-2xl font-bold ${
                  positive ? "text-error" : "text-tertiary"
                }`}
              >
                {positive ? "Yes" : "No"}
              </p>
            </div>
          </div>
          <p className={`mt-3 text-sm font-semibold ${positive ? "text-error" : "text-tertiary"}`}>
            {positive ? positiveLabel : negativeLabel}
          </p>
          <p className="mt-1 text-xs text-on-surface-variant">
            Predicted probability {pct}%. Severity/risk-band conversion is not yet
            available for heart disease.
          </p>
        </div>

        <div>
          <h3 className="text-headline-sm text-on-surface mb-2">
            Top contributing features (SHAP)
          </h3>
          <p className="text-xs text-on-surface-variant mb-3">
            These features contributed to the model prediction. They do not imply
            causation.
          </p>
          <FactorChart factors={result.top_factors} />
        </div>

        {result.disclaimer && (
          <p className="text-xs text-on-surface-variant leading-relaxed border-t pt-3">
            {result.disclaimer}
          </p>
        )}
      </div>
    );
  }

  const band = RISK_BANDS[result.risk_band] ?? RISK_BANDS.Moderate;

  return (
    <div className="space-y-5">
      <div className={`rounded-xl border p-5 ${band.bgColor}`}>
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <p className="text-label-md text-on-surface-variant">Model risk band</p>
            <p className={`text-2xl font-bold ${band.textColor}`}>{band.label}</p>
          </div>
          <div className="text-right">
            <p className="text-label-md text-on-surface-variant">Predicted probability</p>
            <p className="text-2xl font-bold text-on-surface">{pct}%</p>
          </div>
        </div>

        <div className="mt-4">
          <div className="h-3 w-full rounded-full bg-surface-container-high overflow-hidden">
            <div
              className="h-full rounded-full transition-all"
              style={{ width: `${pct}%`, backgroundColor: band.color }}
            />
          </div>
          <div className="flex justify-between text-caption text-on-surface-variant mt-1">
            <span>0%</span>
            <span>threshold @ {Math.round(result.threshold * 100)}%</span>
            <span>100%</span>
          </div>
        </div>

        <p className={`mt-3 text-sm font-semibold ${band.textColor}`}>
          {positive ? positiveLabel : negativeLabel}
        </p>
        <p className="mt-1 text-xs text-on-surface-variant">
          Risk bands are model-defined categories, not clinical diagnoses.
        </p>
      </div>

      <div>
        <h3 className="text-headline-sm text-on-surface mb-2">
          Top contributing features (SHAP)
        </h3>
        <p className="text-xs text-on-surface-variant mb-3">
          These features contributed to the model prediction. They do not imply
          causation.
        </p>
        <FactorChart factors={result.top_factors} />
      </div>

      {result.disclaimer && (
        <p className="text-xs text-on-surface-variant leading-relaxed border-t pt-3">
          {result.disclaimer}
        </p>
      )}
    </div>
  );
}
