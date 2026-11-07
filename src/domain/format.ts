export function formatAud(value: number, digits = 0): string {
  return new Intl.NumberFormat("en-AU", {
    style: "currency",
    currency: "AUD",
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(value);
}

export function formatNumber(value: number, digits = 0): string {
  return new Intl.NumberFormat("en-AU", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(value);
}

export function formatUnits(value: number): string {
  if (!Number.isFinite(value)) return "—";
  const digits = Math.abs(value) >= 100 || Number.isInteger(value) ? 0 : 1;
  return formatNumber(value, digits);
}

export function formatPercent(rate: number): string {
  if (!Number.isFinite(rate)) return "—";
  const percent = rate * 100;
  const digits = Number.isInteger(percent) ? 0 : 1;
  return `${formatNumber(percent, digits)}%`;
}

export function csvCell(value: string | number | null): string {
  if (value == null) return "";
  let text = String(value);
  if (/^[=+\-@]/.test(text)) text = `'${text}`;
  if (/[",\n\r]/.test(text)) return `"${text.replaceAll('"', '""')}"`;
  return text;
}
