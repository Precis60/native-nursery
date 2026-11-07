import { Bar, BarChart, CartesianGrid, Cell, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { formatAud } from "../domain/format.ts";
import type { ModelResult } from "../domain/model.ts";

function Tip({ active, payload, label }: { active?: boolean; payload?: { value?: number }[]; label?: string }) {
  if (!active || !payload?.length) return null;
  const value = payload[0]?.value;
  return (
    <div className="rounded-lg bg-ink px-2 py-1 text-sm text-paper">
      {label}: {typeof value === "number" ? formatAud(value) : "—"}
    </div>
  );
}

export function ProfitChart({ result }: { result: ModelResult }) {
  if (result.operatingProfitBeforeOwnerLabour == null || result.revenueExGst == null) return null;
  const data = [
    { name: "Revenue", value: result.revenueExGst },
    { name: "Variable", value: -(result.variableProductionCost ?? 0) },
    { name: "Media", value: -(result.growingConsumables ?? 0) },
    { name: "Tubes/pots", value: -(result.reusableContainers ?? 0) },
    { name: "Seed", value: -(result.purchasedSeed ?? 0) },
    { name: "Overhead", value: -(result.annualOverhead ?? 0) },
    { name: "Hired", value: -(result.hiredLabourCash ?? 0) },
    { name: "Rent", value: -(result.businessRent ?? 0) },
    { name: "Cash profit", value: result.operatingProfitBeforeOwnerLabour },
  ];
  return (
    <section className="panel" aria-hidden="true">
      <h2 className="font-serif text-2xl">Cash bridge</h2>
      <p className="note mt-1">Operating cash only. Durable equipment is not in this bridge, and media is not inside the per-plant rate.</p>
      <div className="mt-3 h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 8 }}>
            <CartesianGrid stroke="#ddd4c4" vertical={false} />
            <XAxis dataKey="name" tick={{ fill: "#5e584e", fontSize: 12 }} />
            <YAxis tick={{ fill: "#5e584e", fontSize: 12 }} width={56} />
            <Tooltip content={<Tip />} />
            <Bar dataKey="value" radius={[6, 6, 0, 0]}>
              {data.map((row) => (
                <Cell key={row.name} fill={row.value >= 0 ? "#1e3b30" : "#8c3a22"} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}

export function CashChart({ result }: { result: ModelResult }) {
  if (!result.monthly) return null;
  const data = result.monthly.map((month) => ({
    name: month.label.slice(0, 3),
    closing: Math.round(month.closingCash),
    revenue: Math.round(month.revenue),
  }));
  return (
    <section className="panel" aria-hidden="true">
      <h2 className="font-serif text-2xl">Closing cash sketch</h2>
      <p className="note mt-1">November includes seed and equipment. Later months are mostly sales against a flat cost.</p>
      <div className="mt-3 h-64">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 8 }}>
            <CartesianGrid stroke="#ddd4c4" vertical={false} />
            <XAxis dataKey="name" tick={{ fill: "#5e584e", fontSize: 12 }} />
            <YAxis tick={{ fill: "#5e584e", fontSize: 12 }} width={56} />
            <Tooltip content={<Tip />} />
            <Line type="monotone" dataKey="closing" name="Closing" stroke="#1e3b30" strokeWidth={2.5} dot={false} />
            <Line type="monotone" dataKey="revenue" name="Revenue" stroke="#8a5a12" strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}
