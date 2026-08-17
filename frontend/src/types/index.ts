// Shared types matching the backend's common prediction response. The frontend
// never imports disease-specific types; every disease uses these shapes.

export type RiskBand = "Low" | "Moderate" | "High";

export interface Factor {
  feature: string;
  impact: number;
  direction: "increases_risk" | "decreases_risk";
  shap_value?: number;
}

export interface PredictionResponse {
  disease: string;
  prediction: number;
  probability: number;
  risk_band: RiskBand;
  threshold: number;
  top_factors: Factor[];
  model_version?: string;
  disclaimer?: string;
}

export interface ModelInfo {
  disease: string;
  status: "ready" | "not_ready";
  model_name?: string;
  model_version?: string;
  selected_family?: string;
  feature_names: string[];
  threshold?: number;
  risk_bands?: Record<string, [number, number]>;
  test_metrics?: Record<string, unknown>;
  validation_metrics?: Record<string, unknown>;
  message?: string;
}

// Not-ready error shape returned with HTTP 503 by placeholder modules.
export interface NotReadyDetail {
  status: "not_ready";
  disease: string;
  message: string;
}

export interface FieldDef {
  name: string;
  label: string;
  type: "number";
  min: number;
  max: number;
  step: number;
  default: number;
  hint: string;
}

// Risk band configuration sourced centrally so labels/colors are not
// hard-coded across components. Thresholds here are for UI hinting only; the
// backend is the source of truth for band assignment.
export interface RiskBandConfig {
  label: RiskBand;
  color: string;
  textColor: string;
  bgColor: string;
}

export interface DiseaseConfig {
  key: string; // URL segment, e.g. "diabetes" | "heart"
  title: string;
  subtitle: string;
  apiDisease: string; // canonical disease id used in the response/503
  fields: FieldDef[];
  resultLabels: {
    positive: string;
    negative: string;
  };
}
