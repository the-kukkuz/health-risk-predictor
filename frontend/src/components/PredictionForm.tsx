import { useState } from "react";
import type { DiseaseConfig } from "../types";

interface Props {
  config: DiseaseConfig;
  loading: boolean;
  onSubmit: (values: Record<string, number>) => void;
}

// Reusable, data-driven form. The same component renders diabetes today and
// heart disease when its field list is added -- no duplicated forms.
export default function PredictionForm({ config, loading, onSubmit }: Props) {
  const [values, setValues] = useState<Record<string, number>>(() => {
    const init: Record<string, number> = {};
    config.fields.forEach((f) => (init[f.name] = f.default));
    return init;
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  function setField(name: string, raw: string) {
    const num = parseFloat(raw);
    setValues((v) => ({ ...v, [name]: num }));
  }

  function validate(): boolean {
    const errs: Record<string, string> = {};
    config.fields.forEach((f) => {
      const v = values[f.name];
      if (Number.isNaN(v)) errs[f.name] = "Required numeric value";
      else if (v < f.min || v > f.max)
        errs[f.name] = `Must be between ${f.min} and ${f.max}`;
    });
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    onSubmit(values);
  }

  function fillSample() {
    // A realistic sample record (the first positive row of the UCI dataset).
    const sample: Record<string, number> = {
      Pregnancies: 6,
      Glucose: 148,
      BloodPressure: 72,
      SkinThickness: 35,
      Insulin: 0,
      BMI: 33.6,
      DiabetesPedigreeFunction: 0.627,
      Age: 50,
    };
    setValues((v) => ({ ...v, ...sample }));
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {config.fields.map((f) => (
          <div key={f.name}>
            <label className="label-field" htmlFor={f.name}>
              {f.label}
            </label>
            <input
              id={f.name}
              type="number"
              className="input-field"
              min={f.min}
              max={f.max}
              step={f.step}
              value={values[f.name] ?? ""}
              onChange={(e) => setField(f.name, e.target.value)}
              aria-invalid={!!errors[f.name]}
            />
            {errors[f.name] ? (
              <p className="mt-1 text-xs text-red-600">{errors[f.name]}</p>
            ) : (
              <p className="hint">{f.hint}</p>
            )}
          </div>
        ))}
      </div>

      <div className="flex flex-wrap gap-3 pt-2">
        <button type="submit" className="btn-primary" disabled={loading}>
          {loading ? "Calculating..." : "Predict Risk"}
        </button>
        {config.key === "diabetes" && (
          <button
            type="button"
            className="text-sm text-brand-700 hover:underline"
            onClick={fillSample}
            disabled={loading}
          >
            Fill sample record
          </button>
        )}
      </div>
    </form>
  );
}
