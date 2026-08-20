import { useState } from "react";
import Icon from "./Icon";

interface Props {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  hint?: string;
}

// Password input with visibility toggle (eye icon). Handles both controlled
// and uncontrolled usage. Shows/hides password on click, validates length.
export default function PasswordInput({ id, label, value, onChange, error, hint }: Props) {
  const [visible, setVisible] = useState(false);

  return (
    <div>
      <label className="label-field" htmlFor={id}>
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          type={visible ? "text" : "password"}
          className="input-field pr-10"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          aria-invalid={!!error}
          aria-describedby={error ? `${id}-error` : hint ? `${id}-hint` : undefined}
        />
        <button
          type="button"
          onClick={() => setVisible(!visible)}
          className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 transition-colors"
          aria-label={visible ? "Hide password" : "Show password"}
        >
          <Icon name={visible ? "visibility_off" : "visibility"} className="text-[18px]" />
        </button>
      </div>
      {error ? (
        <p id={`${id}-error`} className="field-error" role="alert">
          {error}
        </p>
      ) : hint ? (
        <p id={`${id}-hint`} className="hint">
          {hint}
        </p>
      ) : null}
    </div>
  );
}
