import type { DiseaseConfig, RiskBandConfig } from "../types";

// Central disease configuration. The reusable PredictionPage renders entirely
// from this object. To add the integrated heart module, only add a field list
// here -- no new component, route logic, or API plumbing is required.
export const DISEASES: Record<string, DiseaseConfig> = {
  diabetes: {
    key: "diabetes",
    title: "Diabetes Risk Prediction",
    subtitle:
      "Estimate diabetes risk from clinical features using the trained model.",
    apiDisease: "diabetes",
    resultLabels: {
      positive: "Elevated diabetes risk",
      negative: "Lower diabetes risk",
    },
    fields: [
      { name: "Pregnancies", label: "Pregnancies", type: "number", min: 0, max: 25, step: 1, default: 1, hint: "Number of pregnancies" },
      { name: "Glucose", label: "Glucose", type: "number", min: 0, max: 500, step: 1, default: 120, hint: "Plasma glucose concentration" },
      { name: "BloodPressure", label: "Blood Pressure", type: "number", min: 0, max: 250, step: 1, default: 70, hint: "Diastolic BP (mm Hg)" },
      { name: "SkinThickness", label: "Skin Thickness", type: "number", min: 0, max: 150, step: 1, default: 20, hint: "Triceps skin fold (mm)" },
      { name: "Insulin", label: "Insulin", type: "number", min: 0, max: 1500, step: 1, default: 80, hint: "2-hour serum insulin (mu U/ml)" },
      { name: "BMI", label: "BMI", type: "number", min: 0, max: 100, step: 0.1, default: 28.0, hint: "Body mass index" },
      { name: "DiabetesPedigreeFunction", label: "Diabetes Pedigree Function", type: "number", min: 0, max: 5, step: 0.01, default: 0.5, hint: "Diabetes pedigree function" },
      { name: "Age", label: "Age", type: "number", min: 0, max: 120, step: 1, default: 35, hint: "Age (years)" },
    ],
  },
  heart: {
    key: "heart",
    title: "Heart Disease Risk Prediction",
    subtitle:
      "Heart disease prediction module is being integrated independently.",
    apiDisease: "heart_disease",
    resultLabels: {
      positive: "Elevated heart disease risk",
      negative: "Lower heart disease risk",
    },
    // Fields will be populated by the heart integration contract. The page
    // already handles the "not_ready" state gracefully in the meantime.
    fields: [],
  },
};

// Model-defined risk band styling (NOT clinical categories).
export const RISK_BANDS: Record<string, RiskBandConfig> = {
  Low: {
    label: "Low",
    color: "#16a34a",
    textColor: "text-green-700",
    bgColor: "bg-green-50 border-green-200",
  },
  Moderate: {
    label: "Moderate",
    color: "#d97706",
    textColor: "text-amber-700",
    bgColor: "bg-amber-50 border-amber-200",
  },
  High: {
    label: "High",
    color: "#dc2626",
    textColor: "text-red-700",
    bgColor: "bg-red-50 border-red-200",
  },
};

export const DISCLAIMER =
  "This system provides machine-learning-based risk stratification for research and decision-support purposes. It is not a medical diagnostic tool and should not be used as a substitute for professional medical evaluation.";
