import { useState } from "react";

export function NumberField({
  id,
  label,
  hint,
  value,
  onChange,
  error,
  suffix,
}: {
  id: string;
  label: string;
  hint?: string;
  value: number;
  onChange: (value: number) => void;
  error?: string;
  suffix?: string;
}) {
  const [text, setText] = useState(() => (Number.isFinite(value) ? String(value) : ""));
  return (
    <label className="field" htmlFor={id}>
      <span>
        {label}
        {suffix ? <span className="font-normal text-muted"> {suffix}</span> : null}
      </span>
      {hint ? <small id={`${id}-hint`}>{hint}</small> : null}
      <input
        id={id}
        inputMode="decimal"
        aria-describedby={hint ? `${id}-hint` : undefined}
        aria-invalid={Boolean(error)}
        value={text}
        onChange={(event) => {
          const raw = event.target.value;
          setText(raw);
          if (raw.trim() === "" || raw === "-" || raw === "." || raw === "-.") onChange(Number.NaN);
          else onChange(Number(raw));
        }}
      />
      {error ? <strong role="alert">{error}</strong> : null}
    </label>
  );
}

export function PercentField({
  id,
  label,
  hint,
  value,
  onChange,
  error,
}: {
  id: string;
  label: string;
  hint?: string;
  value: number;
  onChange: (value: number) => void;
  error?: string;
}) {
  const [text, setText] = useState(() => (Number.isFinite(value) ? String(Math.round(value * 1000) / 10) : ""));
  return (
    <label className="field" htmlFor={id}>
      <span>{label}</span>
      {hint ? <small id={`${id}-hint`}>{hint}</small> : null}
      <input
        id={id}
        inputMode="decimal"
        aria-describedby={hint ? `${id}-hint` : undefined}
        aria-invalid={Boolean(error)}
        value={text}
        onChange={(event) => {
          const raw = event.target.value;
          setText(raw);
          if (raw.trim() === "" || raw === ".") onChange(Number.NaN);
          else {
            const percent = Number(raw);
            onChange(Number.isFinite(percent) ? percent / 100 : Number.NaN);
          }
        }}
      />
      {error ? <strong role="alert">{error}</strong> : null}
    </label>
  );
}
