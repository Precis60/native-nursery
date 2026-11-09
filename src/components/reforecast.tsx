import { useMemo } from "react";
import { CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { formatAud, formatPercent, formatUnits } from "../domain/format.ts";
import type { ModelResult, ScenarioInput } from "../domain/model.ts";
import type { ActualsSummary } from "../domain/records.ts";
import { buildReforecast, MIN_OBSERVED_SAMPLE, type ReforecastView } from "../domain/reforecast.ts";

const BAD = "#8c3a22";

function money(value: number | null | undefined): string {
  return value == null || !Number.isFinite(value) ? "—" : formatAud(value);
}

function delta(value: number | null | undefined, against: number | null | undefined) {
  if (value == null || against == null) return null;
  const diff = value - against;
  if (Math.abs(diff) < 0.5) return <span className="note"> on plan</span>;
  return (
    <span className="note" style={{ color: diff < 0 ? BAD : undefined }}>
      {" "}
      {diff > 0 ? "+" : "−"}
      {formatAud(Math.abs(diff))}
    </span>
  );
}

function Tip({ active, payload, label }: { active?: boolean; payload?: { value?: number | null; name?: string }[]; label?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg bg-ink px-2 py-1 text-sm text-paper">
      {label}
      {payload
        .filter((entry) => typeof entry.value === "number")
        .map((entry) => (
          <div key={entry.name}>
            {entry.name}: {formatAud(entry.value as number)}
          </div>
        ))}
    </div>
  );
}

export function ReforecastBoard({
  inputs,
  result,
  summary,
}: {
  inputs: ScenarioInput;
  result: ModelResult;
  summary: ActualsSummary;
}) {
  const forecast = useMemo(() => buildReforecast(inputs, result, summary), [inputs, result, summary]);
  if (forecast.status !== "ok" || !forecast.onPlan) {
    return (
      <section className="panel" data-testid="reforecast">
        <h2 className="font-serif text-2xl">Year-end forecast</h2>
        <p className="note mt-1">Fix the planner inputs to see a year-end forecast.</p>
      </section>
    );
  }
  const views: { key: string; title: string; view: ReforecastView }[] = [
    { key: "plan", title: "On plan from here", view: forecast.onPlan },
  ];
  if (forecast.atPace) views.push({ key: "pace", title: "At current pace", view: forecast.atPace });
  const chart = forecast.monthly.map((row) => ({ ...row, name: row.label.slice(0, 3) }));
  const planLine = cumulativePlan(inputs, result);

  return (
    <section className="panel" data-testid="reforecast">
      <h2 className="font-serif text-2xl">Year-end forecast</h2>
      <p className="note mt-1">
        Actuals to {forecast.monthLabel}, then the plan for the rest of the year.{" "}
        {forecast.pace == null
          ? "Pace appears once at least 5% of planned sales were due."
          : `Sales so far are ${formatPercent(Math.round(forecast.pace * 100) / 100)} of what the plan expected by now.`}
      </p>

      <div className="table-wrap mt-3">
        <table className="data">
          <caption className="sr-only">Year-end forecast against the original plan</caption>
          <thead>
            <tr>
              <th>Year end</th>
              <th className="num">Original plan</th>
              {views.map((item) => (
                <th key={item.key} className="num">
                  {item.title}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr>
              <th scope="row">Plants sold</th>
              <td className="num">{formatUnits(inputs.salesTarget)}</td>
              {views.map((item) => (
                <td key={item.key} className="num">
                  {formatUnits(Math.round(item.view.yearEndUnits))}
                </td>
              ))}
            </tr>
            <tr>
              <th scope="row">Revenue, ex GST</th>
              <td className="num">{money(forecast.planYearEndRevenue)}</td>
              {views.map((item) => (
                <td key={item.key} className="num" data-testid={`reforecast-revenue-${item.key}`}>
                  {money(item.view.yearEndRevenue)}
                  {delta(item.view.yearEndRevenue, forecast.planYearEndRevenue)}
                </td>
              ))}
            </tr>
            <tr>
              <th scope="row">Cash profit</th>
              <td className="num">{money(forecast.planYearEndCashProfit)}</td>
              {views.map((item) => (
                <td key={item.key} className="num">
                  {money(item.view.yearEndCashProfit)}
                  {delta(item.view.yearEndCashProfit, forecast.planYearEndCashProfit)}
                </td>
              ))}
            </tr>
            <tr>
              <th scope="row">Closing cash</th>
              <td className="num">{money(result.closingCash)}</td>
              {views.map((item) => (
                <td key={item.key} className="num" style={{ color: item.view.yearEndClosingCash < 0 ? BAD : undefined }}>
                  {money(item.view.yearEndClosingCash)}
                </td>
              ))}
            </tr>
            <tr>
              <th scope="row">Plants still to start</th>
              <td className="num">{result.startedRequired == null ? "—" : formatUnits(Math.ceil(result.startedRequired))}</td>
              {views.map((item) => (
                <td key={item.key} className="num">
                  {item.view.startsStillNeeded == null ? "—" : formatUnits(Math.ceil(item.view.startsStillNeeded))}
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>

      <div className="mt-4 h-64" aria-hidden="true">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chart.map((row, index) => ({ ...row, plan: planLine[index] }))} margin={{ top: 8, right: 8, left: 0, bottom: 8 }}>
            <CartesianGrid stroke="#ddd4c4" vertical={false} />
            <XAxis dataKey="name" tick={{ fill: "#5e584e", fontSize: 12 }} />
            <YAxis tick={{ fill: "#5e584e", fontSize: 12 }} width={56} tickFormatter={(value: number) => (value >= 1000 ? `$${Math.round(value / 1000)}k` : `$${value}`)} />
            <Tooltip content={<Tip />} />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            <Line type="monotone" dataKey="plan" name="Original plan" stroke="#b9a77d" strokeDasharray="4 4" dot={false} />
            <Line type="monotone" dataKey="onPlan" name="Forecast, on plan" stroke="#1e3b30" dot={false} />
            {forecast.atPace ? <Line type="monotone" dataKey="atPace" name="Forecast, at pace" stroke={BAD} dot={false} /> : null}
            <Line type="monotone" dataKey="actual" name="Actual" stroke="#1e3b30" strokeWidth={3} dot={{ r: 3 }} connectNulls={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <h3 className="mt-4 font-serif text-xl">Rates used</h3>
      <ul className="note mt-1 grid gap-1 sm:grid-cols-3">
        {forecast.rates.map((rate) => (
          <li key={rate.label}>
            <strong>{rate.label}:</strong> {formatPercent(Math.round(rate.used * 1000) / 1000)}{" "}
            {rate.source === "observed"
              ? `from batches (${formatUnits(rate.sample)} plants)`
              : rate.observed == null
                ? "from the plan"
                : rate.label === "Germination"
                  ? `from the plan; batches show ${formatPercent(Math.round(rate.observed * 1000) / 1000)} on ${formatUnits(rate.sample)} sown, under ${MIN_OBSERVED_SAMPLE}`
                  : `from the plan; batches show ${formatPercent(Math.round(rate.observed * 1000) / 1000)} so far, but plants still growing or on the bench are not losses yet`}
          </li>
        ))}
      </ul>
      <p className="note mt-2">
        Costs still to come are the remaining months of overhead, wages and rent, plus any part of the seed, media, container
        and equipment budgets not yet spent. Spending over a budget is not refunded. Stock on hand counts towards plants
        still to start.
      </p>
    </section>
  );
}

/** Cumulative revenue the original plan expected, month by month. */
function cumulativePlan(inputs: ScenarioInput, result: ModelResult): number[] {
  const weights = inputs.monthlySalesWeights;
  const total = weights.reduce((sum, weight) => sum + weight, 0);
  let running = 0;
  return weights.map((weight) => {
    running += total > 0 ? ((result.revenueExGst ?? 0) * weight) / total : 0;
    return Math.round(running);
  });
}
