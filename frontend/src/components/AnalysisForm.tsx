import { useMemo, useState } from "react";
import type { DiseaseConfig, FieldDef } from "../types";
import Icon from "./Icon";

interface Props {
  configs: DiseaseConfig[];
  loading: boolean;
  onSubmit: (valuesByDisease: Record<string, Record<string, number>>) => void;
}

// Unified form that merges fields from ALL selected disease configs into ONE
// form with ONE submit button. Fields are grouped into sections (Demographic,
// Vitals, Lab Results) preserving config order. Numeric fields use number
// inputs with unit suffixes; categorical fields use dropdowns.
export default function AnalysisForm({ configs, loading, onSubmit }: Props) {
  // Merge all fields from all configs into a single flat list.
  // Deduplicate by (name, group) to avoid duplicates when both diseases share
  // a field like "age". Preserve order: first config's fields, then new ones.
  const allFields = useMemo(() => {
    const seen = new Set<string>();
    const merged: FieldDef[] = [];
    for (const cfg of configs) {
      for (const f of cfg.fields) {
        const key = `${f.name}::${f.group ?? "Other"}`;
        if (!seen.has(key)) {
          seen.add(key);
          merged.push(f);
        }
      }
    }
    return merged;
  }, [configs]);

  // Initialize form state with defaults from the first config that defines each field.
  const [values, setValues] = useState<Record<string, number>>(() => {
    const init: Record<string, number> = {};
    for (const f of allFields) {
      if (!(f.name in init)) init[f.name] = f.default;
    }
    return init;
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Group fields by section, preserving order.
  const groups: Record<string, FieldDef[]> = {};
  allFields.forEach((f) => {
    const g = f.group ?? "Other";
    (groups[g] = groups[g] ?? []).push(f);
  });

  function setField(field: FieldDef, raw: string) {
    if (field.type === "select") {
      setValues((v) => ({ ...v, [field.name]: Number(raw) }));
    } else {
      const num = parseFloat(raw);
      setValues((v) => ({ ...v, [field.name]: num }));
    }
  }

  function validate(): boolean {
    const errs: Record<string, string> = {};
    allFields.forEach((f) => {
      const v = values[f.name];
      if (f.type === "number") {
        if (Number.isNaN(v)) errs[f.name] = "Required numeric value";
        else if (f.min !== undefined && v < f.min) errs[f.name] = `Min ${f.min}`;
        else if (f.max !== undefined && v > f.max) errs[f.name] = `Max ${f.max}`;
      }
    });
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;

    // Partition flat values into per-disease objects matching each backend schema.
    const valuesByDisease: Record<string, Record<string, number>> = {};
    for (const cfg of configs) {
      const diseaseValues: Record<string, number> = {};
      for (const f of cfg.fields) {
        diseaseValues[f.name] = values[f.name] ?? f.default;
      }
      valuesByDisease[cfg.key] = diseaseValues;
    }
    onSubmit(valuesByDisease);
  }

  const sectionIcons: Record<string, string> = {
    Demographic: "person",
    Vitals: "vital_signs",
    "Lab Results": "science",
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {Object.entries(groups).map(([g, fields]) => (
        <section
          key={g}
          className="card p-5"
        >
          <div className="flex items-center gap-2 mb-4 border-b border-outline-variant pb-3">
            <Icon name={sectionIcons[g] ?? "info"} className="text-secondary text-[18px]" />
            <h2 className="text-headline-md text-on-surface">{g}</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {fields.map((f) => (
              <div key={f.name}>
                <label className="label-field" htmlFor={f.name}>
                  {f.label}
                </label>
                {f.type === "select" ? (
                  <div className="relative">
                    <select
                      id={f.name}
                      className="select-field"
                      value={values[f.name]}
                      onChange={(e) => setField(f, e.target.value)}
                    >
                      {f.options?.map((o) => (
                        <option key={o.value} value={o.value}>
                          {o.label}
                        </option>
                      ))}
                    </select>
                    <Icon
                      name="arrow_drop_down"
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-outline-variant pointer-events-none text-[18px]"
                    />
                  </div>
                ) : (
                  <div className="relative">
                    <input
                      id={f.name}
                      type="number"
                      className="input-field"
                      min={f.min}
                      max={f.max}
                      step={f.step}
                      value={Number.isNaN(values[f.name]) ? "" : values[f.name]}
                      onChange={(e) => setField(f, e.target.value)}
                      aria-invalid={!!errors[f.name]}
                    />
                    {f.unit && (
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-caption text-outline-variant">
                        {f.unit}
                      </span>
                    )}
                  </div>
                )}
                {errors[f.name] ? (
                  <p className="mt-1 text-xs text-error">{errors[f.name]}</p>
                ) : (
                  f.hint && <p className="hint">{f.hint}</p>
                )}
              </div>
            ))}
          </div>
        </section>
      ))}

      <div className="flex justify-end pt-2">
        <button type="submit" className="btn-primary" disabled={loading}>
          <Icon name="analytics" className="text-[18px]" />
          {loading ? "Analyzing..." : "Analyze Risk Profile"}
        </button>
      </div>
    </form>
  );
}
