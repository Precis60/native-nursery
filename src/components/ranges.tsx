import { useMemo } from "react";
import { Bar, BarChart, CartesianGrid, Cell, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { formatAud, formatUnits } from "../domain/format.ts";
import type { ScenarioInput } from "../domain/model.ts";
import { buildRangeReport } from "../domain/sensitivity.ts";

const GOOD = "#1e3b30";
const BAD = "#8c3a22";

function money(value: number | null): string {
  return value == null || !Number.isFinite(value) ? "—" : formatAud(value);
}

function signed(value: number): string {
  return `${value >= 0 ? "+" : "−"}${formatAud(Math.abs(value))}`;
}

type Row = { name: string; swing: string; down: number; up: number };

function TornadoTip({ active, payload }: { active?: boolean; payload?: { payload?: Row }[] }) {
  const row = payload?.[0]?.payload;
  if (!active || !row) return null;
  return (
    <div className="max-w-xs rounded-lg bg-ink px-2 py-1 text-sm text-paper">
      <strong>{row.name}</strong> ({row.swing})
      <br />
      Cautious {signed(row.down)} · Strong {signed(row.up)}
    </div>
  );
}

export function RangeBoard({ inputs }: { inputs: ScenarioInput }) {
  const report = useMemo(() => buildRangeReport(inputs), [inputs]);
  if (report.status !== "ok" || report.baseProfit == null) return null;
  const base = report.baseProfit;
  const rows: Row[] = report.bars.map((bar) => ({
    name: bar.label,
    swing: bar.swing,
    down: Math.min(bar.cautious - base, 0),
    up: Math.max(bar.strong - base, 0),
  }));
  const [cautious] = report.cases;
  const top = report.bars[0];

  return (
    <section className="panel" data-testid="ranges">
      <h2 className="font-serif text-2xl">Range of outcomes</h2>
      <p className="note mt-1">
        The same scenario with every driver at its cautious end, as entered, and at its strong end. Use the cautious case to
        size your cash buffer, not as a prediction.
      </p>

      <div className="table-wrap mt-3">
        <table className="data">
          <caption className="sr-only">Cautious, base and strong cases</caption>
          <thead>
            <tr>
              <th>Case</th>
              <th className="num">Revenue ex GST</th>
              <th className="num">Cash profit</th>
              <th className="num">After owner time</th>
              <th className="num">Lowest cash</th>
              <th className="num">Plants to start</th>
            </tr>
          </thead>
          <tbody>
            {report.cases.map((row) => (
              <tr key={row.id} className={row.id === "base" ? "font-semibold" : undefined} data-testid={`case-${row.id}`}>
                <th scope="row">{row.label}</th>
                <td className="num">{money(row.revenue)}</td>
                <td className="num" style={{ color: (row.cashProfit ?? 0) < 0 ? BAD : undefined }}>
                  {money(row.cashProfit)}
                </td>
                <td className="num" style={{ color: (row.profitAfterOwner ?? 0) < 0 ? BAD : undefined }}>
                  {money(row.profitAfterOwner)}
                </td>
                <td className="num" style={{ color: (row.lowestCash ?? 0) < 0 ? BAD : undefined }}>
                  {money(row.lowestCash)}
                  {row.lowestCashMonth ? <span className="note"> {row.lowestCashMonth.slice(0, 3)}</span> : null}
                </td>
                <td className="num">{row.starts == null ? "—" : formatUnits(Math.ceil(row.starts))}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {cautious && cautious.lowestCash != null && cautious.lowestCash < 0 ? (
        <div className="callout bad mt-3" role="status">
          In the cautious case cash drops to {money(cautious.lowestCash)} in {cautious.lowestCashMonth}. Opening cash of about{" "}
          {money(inputs.openingCash - cautious.lowestCash)} would cover it.
        </div>
      ) : null}

      <h3 className="mt-5 font-serif text-xl">What moves cash profit most</h3>
      <p className="note mt-1">
        Each bar moves one driver on its own from the base of {formatAud(base)}.
        {top ? ` ${top.label} matters most: ${formatAud(top.cautious)} to ${formatAud(top.strong)}.` : ""}
      </p>
      <div className="mt-3 h-72" aria-hidden="true">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={rows} layout="vertical" stackOffset="sign" margin={{ top: 4, right: 12, left: 4, bottom: 4 }}>
            <CartesianGrid stroke="#ddd4c4" horizontal={false} />
            <XAxis type="number" tick={{ fill: "#5e584e", fontSize: 12 }} tickFormatter={(value: number) => signed(value)} />
            <YAxis type="category" dataKey="name" width={118} tick={{ fill: "#5e584e", fontSize: 12 }} />
            <ReferenceLine x={0} stroke="#5e584e" />
            <Tooltip content={<TornadoTip />} cursor={{ fill: "rgba(0,0,0,0.04)" }} />
            <Bar dataKey="down" stackId="swing" radius={[6, 0, 0, 6]}>
              {rows.map((row) => (
                <Cell key={row.name} fill={BAD} />
              ))}
            </Bar>
            <Bar dataKey="up" stackId="swing" radius={[0, 6, 6, 0]}>
              {rows.map((row) => (
                <Cell key={row.name} fill={GOOD} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      <ul className="note mt-2 grid gap-1 sm:grid-cols-2">
        {report.bars.map((bar) => (
          <li key={bar.id}>
            <strong>{bar.label}:</strong> {bar.swing}
          </li>
        ))}
        {report.production.map((row) => (
          <li key={row.id}>
            <strong>{row.label}:</strong> {row.swing} changes plants to start from{" "}
            {row.strongStarts == null ? "—" : formatUnits(Math.ceil(row.strongStarts))} to{" "}
            {row.cautiousStarts == null ? "—" : formatUnits(Math.ceil(row.cautiousStarts))}. Seed and media are fixed allowances, so cash
            profit does not move.
          </li>
        ))}
      </ul>
    </section>
  );
}
