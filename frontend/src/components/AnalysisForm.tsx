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
// Vitals, Lab Results) preserving config order.
export default function AnalysisForm({ configs, loading, onSubmit }: Props) {
  const allFields = useMemo(() => {
    const seen = new Set<string>();
    const merged: FieldDef[] = [];
    for (const cfg of configs) {
      for (const f of cfg.fields) {
        const key = `${f.name.toLowerCase()}::${(f.group ?? "Other").toLowerCase()}`;
        if (!seen.has(key)) {
          seen.add(key);
          merged.push(f);
        }
      }
    }
    return merged;
  }, [configs]);

  const [values, setValues] = useState<Record<string, number>>(() => {
    const init: Record<string, number> = {};
    for (const f of allFields) {
      if (!(f.name in init)) init[f.name] = f.default;
    }
    return init;
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const groups: Record<string, FieldDef[]> = {};
  allFields.forEach((f) => {
    const g = f.group ?? "Other";
    (groups[g] = groups[g] ?? []).push(f);
  });

  const sexFieldName = allFields.find(
    (f) => f.name.toLowerCase() === "sex"
  )?.name;
  const isMale = sexFieldName !== undefined && values[sexFieldName] === 1;

  function isFieldDisabled(f: FieldDef): boolean {
    if (f.name === "Pregnancies" && isMale) return true;
    return false;
  }

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
      if (isFieldDisabled(f)) return;
      const v = values[f.name];
      if (f.type === "number") {
        if (Number.isNaN(v)) errs[f.name] = "Required";
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

    const valuesByDisease: Record<string, Record<string, number>> = {};
    for (const cfg of configs) {
      const diseaseValues: Record<string, number> = {};
      for (const f of cfg.fields) {
        const val =
          f.name in values
            ? values[f.name]
            : (Object.entries(values).find(
                ([k]) => k.toLowerCase() === f.name.toLowerCase()
              )?.[1] ?? f.default);
        const disabled = f.name === "Pregnancies" && isMale;
        diseaseValues[f.name] = disabled ? 0 : val;
      }
      valuesByDisease[cfg.key] = diseaseValues;
    }
    onSubmit(valuesByDisease);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {Object.entries(groups).map(([g, fields], idx) => (
        <section key={g}>
          {idx > 0 && <div className="section-divider mb-0" />}
          <h2 className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-4">
            {g}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-5">
            {fields.map((f) => {
              const disabled = isFieldDisabled(f);
              return (
                <div key={f.name} className={disabled ? "opacity-40 pointer-events-none" : ""}>
                  <label className="label-field" htmlFor={f.name}>
                    {f.label}
                    {disabled && (
                      <span className="ml-1.5 text-[10px] font-normal text-gray-400 normal-case">
                        (N/A for male)
                      </span>
                    )}
                  </label>

                  {f.type === "select" ? (
                    <div className="relative">
                      <select
                        id={f.name}
                        className="select-field pr-8"
                        value={values[f.name]}
                        onChange={(e) => setField(f, e.target.value)}
                        disabled={disabled}
                      >
                        {f.options?.map((o) => (
                          <option key={o.value} value={o.value}>
                            {o.label}
                          </option>
                        ))}
                      </select>
                      <Icon
                        name="arrow_drop_down"
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none text-[18px]"
                      />
                    </div>
                  ) : (
                    <div className="relative">
                      <input
                        id={f.name}
                        type="number"
                        className={`input-field ${f.unit ? "pr-12" : ""} ${
                          errors[f.name] ? "border-red-400 focus:border-red-500 focus:ring-red-500/20" : ""
                        }`}
                        min={f.min}
                        max={f.max}
                        step={f.step}
                        value={Number.isNaN(values[f.name]) ? "" : values[f.name]}
                        onChange={(e) => setField(f, e.target.value)}
                        aria-invalid={!!errors[f.name]}
                        disabled={disabled}
                      />
                      {f.unit && (
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 pointer-events-none">
                          {f.unit}
                        </span>
                      )}
                    </div>
                  )}

                  {errors[f.name] ? (
                    <p className="field-error">{errors[f.name]}</p>
                  ) : (
                    f.hint && !disabled && <p className="hint">{f.hint}</p>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      ))}

      <div className="flex items-center justify-between pt-4 border-t border-gray-200">
        <p className="text-xs text-gray-400">
          All fields are required unless marked N/A
        </p>
        <button type="submit" className="btn-primary" disabled={loading}>
          {loading ? (
            <>
              <span className="inline-block w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Analyzing…
            </>
          ) : (
            <>
              <Icon name="analytics" className="text-[16px]" />
              Analyze risk
            </>
          )}
        </button>
      </div>
    </form>
  );
}
