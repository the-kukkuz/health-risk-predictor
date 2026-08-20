import type { DiseaseConfig, RiskBandConfig } from "../types";

// Central disease configuration. The reusable Analysis page renders entirely
// from this object. Fields are grouped into sections and may be numeric or
// categorical (rendered as dropdowns). Values match the trained model inputs.
export const DISEASES: Record<string, DiseaseConfig> = {
  diabetes: {
    key: "diabetes",
    title: "Diabetes Risk Assessment",
    subtitle:
      "Estimate diabetes risk from clinical features using the trained model.",
    apiDisease: "diabetes",
    resultLabels: {
      positive: "Elevated diabetes risk",
      negative: "Lower diabetes risk",
    },
    fields: [
      { name: "Age", label: "Age", type: "number", min: 21, max: 120, step: 1, default: 45, hint: "Patient's age in years", unit: "yrs", group: "Demographic" },
      { name: "Pregnancies", label: "Pregnancies", type: "number", min: 0, max: 25, step: 1, default: 2, hint: "Number of times pregnant", group: "Demographic" },
      { name: "BMI", label: "BMI", type: "number", min: 0, max: 100, step: 0.1, default: 28.5, hint: "Body mass index", unit: "kg/m²", group: "Vitals" },
      { name: "BloodPressure", label: "Blood Pressure", type: "number", min: 0, max: 250, step: 1, default: 72, hint: "Diastolic blood pressure", unit: "mm Hg", group: "Vitals" },
      { name: "Glucose", label: "Glucose", type: "number", min: 0, max: 500, step: 1, default: 120, hint: "Plasma glucose concentration", unit: "mg/dL", group: "Lab Results" },
      { name: "Insulin", label: "Insulin", type: "number", min: 0, max: 1500, step: 1, default: 80, hint: "2-hour serum insulin", unit: "mu U/ml", group: "Lab Results" },
      { name: "SkinThickness", label: "Skin Thickness", type: "number", min: 0, max: 150, step: 1, default: 20, hint: "Triceps skin fold thickness", unit: "mm", group: "Lab Results" },
      { name: "DiabetesPedigreeFunction", label: "Diabetes Pedigree Function", type: "number", min: 0, max: 5, step: 0.001, default: 0.5, hint: "Likelihood of diabetes from family history", group: "Lab Results" },
    ],
  },
  heart: {
    key: "heart",
    title: "Heart Disease Risk Assessment",
    subtitle:
      "Estimate heart disease risk from clinical features using the trained model.",
    apiDisease: "heart",
    resultLabels: {
      positive: "Heart disease risk indicated",
      negative: "No heart disease risk indicated",
    },
    // Heart result is a simple Yes/No for now. Severity/risk-band conversion
    // is future work -- see CLAUDE.md. Input fields below are placeholders.
    fields: [
      { name: "age", label: "Age", type: "number", min: 0, max: 120, step: 1, default: 65, hint: "Age in years", unit: "yrs", group: "Demographic" },
      { name: "sex", label: "Sex", type: "select", default: 1, hint: "Biological sex", options: [{ label: "Female", value: 0 }, { label: "Male", value: 1 }], group: "Demographic" },
      { name: "cp", label: "Chest Pain Type", type: "select", default: 4, hint: "Type of chest pain", options: [{ label: "Typical angina", value: 1 }, { label: "Atypical angina", value: 2 }, { label: "Non-anginal pain", value: 3 }, { label: "Asymptomatic", value: 4 }], group: "Demographic" },
      { name: "trestbps", label: "Resting Blood Pressure", type: "number", min: 0, max: 300, step: 1, default: 160, hint: "Resting blood pressure on admission", unit: "mm Hg", group: "Vitals" },
      { name: "chol", label: "Serum Cholesterol", type: "number", min: 0, max: 600, step: 1, default: 280, hint: "Serum cholesterol", unit: "mg/dl", group: "Vitals" },
      { name: "fbs", label: "Fasting Blood Sugar", type: "select", default: 1, hint: "Fasting blood sugar > 120 mg/dl", options: [{ label: "≤ 120 mg/dl", value: 0 }, { label: "> 120 mg/dl", value: 1 }], group: "Vitals" },
      { name: "restecg", label: "Resting ECG", type: "select", default: 1, hint: "Resting electrocardiographic results", options: [{ label: "Normal", value: 0 }, { label: "ST-T wave abnormality", value: 1 }, { label: "Left ventricular hypertrophy", value: 2 }], group: "Vitals" },
      { name: "thalach", label: "Max Heart Rate", type: "number", min: 0, max: 250, step: 1, default: 110, hint: "Maximum heart rate achieved", unit: "bpm", group: "Vitals" },
      { name: "exang", label: "Exercise-Induced Angina", type: "select", default: 1, hint: "Angina induced by exercise", options: [{ label: "No", value: 0 }, { label: "Yes", value: 1 }], group: "Vitals" },
      { name: "oldpeak", label: "ST Depression", type: "number", min: 0, max: 7, step: 0.1, default: 3.5, hint: "ST depression induced by exercise", unit: "mm", group: "Lab Results" },
      { name: "slope", label: "ST Slope", type: "select", default: 1, hint: "Slope of the peak exercise ST segment", options: [{ label: "Upsloping", value: 1 }, { label: "Flat", value: 2 }, { label: "Downsloping", value: 3 }], group: "Lab Results" },
      { name: "ca", label: "Major Vessels", type: "select", default: 2, hint: "Number of major vessels colored by fluoroscopy", options: [{ label: "0", value: 0 }, { label: "1", value: 1 }, { label: "2", value: 2 }, { label: "3", value: 3 }], group: "Lab Results" },
      { name: "thal", label: "Thalassemia", type: "select", default: 3, hint: "Thalassemia status", options: [{ label: "Normal", value: 3 }, { label: "Fixed defect", value: 6 }, { label: "Reversible defect", value: 7 }], group: "Lab Results" },
    ],
  },
};

// Model-defined risk band styling (NOT clinical categories).
// NOTE: risk bands apply to diabetes. Heart disease currently returns a simple
// Yes/No; severity/risk-band conversion for heart is future work.
export const RISK_BANDS: Record<string, RiskBandConfig> = {
  Low: {
    label: "Low",
    color: "#00501f",
    textColor: "text-tertiary",
    bgColor: "bg-tertiary/10 border-tertiary/20",
  },
  Moderate: {
    label: "Moderate",
    color: "#006398",
    textColor: "text-secondary",
    bgColor: "bg-secondary/10 border-secondary/20",
  },
  High: {
    label: "High",
    color: "#ba1a1a",
    textColor: "text-error",
    bgColor: "bg-error/10 border-error/20",
  },
};

export const DISCLAIMER =
  "This system provides machine-learning-based risk stratification for research and decision-support purposes. It is not a medical diagnostic tool and should not be used as a substitute for professional medical evaluation.";
