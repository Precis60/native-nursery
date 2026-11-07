export function todayISO(): string {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${now.getFullYear()}-${month}-${day}`;
}

export function TextField({
  id,
  label,
  value,
  onChange,
  hint,
  placeholder,
  type = "text",
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  hint?: string;
  placeholder?: string;
  type?: "text" | "date" | "number";
}) {
  return (
    <label className="field" htmlFor={id}>
      <span>{label}</span>
      {hint ? <small id={`${id}-hint`}>{hint}</small> : null}
      <input
        id={id}
        type={type}
        inputMode={type === "number" ? "decimal" : undefined}
        aria-describedby={hint ? `${id}-hint` : undefined}
        value={value}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  );
}

export function SelectField({
  id,
  label,
  value,
  onChange,
  options,
  hint,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: readonly (readonly [string, string])[];
  hint?: string;
}) {
  return (
    <label className="field" htmlFor={id}>
      <span>{label}</span>
      {hint ? <small id={`${id}-hint`}>{hint}</small> : null}
      <select id={id} aria-describedby={hint ? `${id}-hint` : undefined} value={value} onChange={(event) => onChange(event.target.value)}>
        {options.map(([optionValue, optionLabel]) => (
          <option key={optionValue} value={optionValue}>
            {optionLabel}
          </option>
        ))}
      </select>
    </label>
  );
}

export function CheckField({
  id,
  label,
  checked,
  onChange,
  hint,
}: {
  id: string;
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  hint?: string;
}) {
  return (
    <label className="field" htmlFor={id}>
      <span className="flex min-h-11 items-center gap-2">
        <input id={id} type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} />
        {label}
      </span>
      {hint ? <small>{hint}</small> : null}
    </label>
  );
}

export function toNumber(raw: string): number | null {
  if (raw.trim() === "") return null;
  const value = Number(raw);
  return Number.isFinite(value) ? value : null;
}
