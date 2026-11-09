import { useMemo, useState } from "react";
import { Bar, BarChart, CartesianGrid, Cell, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { buildForecast } from "../domain/plan.ts";
import { formatAud, formatPercent, formatUnits } from "../domain/format.ts";
import { SPECIES } from "../domain/species.ts";
import { coerceRecords, expectedShare, planVsActual, recordsToCsv, summarise } from "../domain/records.ts";
import { MONTH_LABELS } from "../domain/model.ts";
import { downloadText } from "../lib/download.ts";
import { usePlanner } from "../state/planner-context.tsx";
import { useRecords } from "../state/records-context.tsx";
import { ReforecastBoard } from "../components/reforecast.tsx";

function money(value: number | null, digits = 0): string {
  if (value == null || !Number.isFinite(value)) return "—";
  return formatAud(value, digits);
}

function Tip({ active, payload, label }: { active?: boolean; payload?: { value?: number; name?: string }[]; label?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg bg-ink px-2 py-1 text-sm text-paper">
      {label}:{" "}
      {payload.map((entry) => `${entry.name ?? ""} ${typeof entry.value === "number" ? formatAud(entry.value) : "—"}`).join(" · ")}
    </div>
  );
}

export function DashboardPage() {
  const { draft, result } = usePlanner();
  const { records, syncState, syncError, warning, dismissWarning, replaceRecords } = useRecords();
  const summary = useMemo(() => summarise(records), [records]);
  const forecast = useMemo(() => buildForecast(draft.inputs), [draft.inputs]);
  const actualBySpecies = useMemo(() => {
    const totals = new Map<string, number>();
    for (const sale of records.sales) {
      const linked =
        sale.species ||
        SPECIES.find(
          (species) =>
            sale.description.toLowerCase().includes(species.botanical.toLowerCase()) ||
            sale.description.toLowerCase().includes(species.common.toLowerCase()),
        )?.botanical;
      if (!linked) continue;
      totals.set(linked, (totals.get(linked) ?? 0) + sale.units);
    }
    return totals;
  }, [records.sales]);
  const pva = useMemo(() => planVsActual(summary, draft.inputs, result), [summary, draft.inputs, result]);
  const [message, setMessage] = useState<string | null>(null);

  const monthlyChart = useMemo(() => {
    const weights = draft.inputs.monthlySalesWeights;
    const totalWeight = weights.reduce((sum, weight) => sum + weight, 0);
    const totals = { expected: 0, actual: 0 };
    return MONTH_LABELS.map((label, index) => {
      totals.expected += totalWeight > 0 ? ((result.revenueExGst ?? 0) * (weights[index] ?? 0)) / totalWeight : 0;
      totals.actual += summary.monthly[index]?.revenueExGst ?? 0;
      return { name: label.slice(0, 3), expected: Math.round(totals.expected), actual: Math.round(totals.actual) };
    });
  }, [draft.inputs.monthlySalesWeights, result.revenueExGst, summary.monthly]);

  const ratesChart = [
    { name: "Germination", plan: draft.inputs.germinationRate * 100, observed: summary.observedGermination != null ? summary.observedGermination * 100 : 0 },
    { name: "Survival", plan: draft.inputs.survivalRate * 100, observed: summary.observedSurvival != null ? summary.observedSurvival * 100 : 0 },
    { name: "Sell-through", plan: draft.inputs.sellThroughRate * 100, observed: summary.observedSellThrough != null ? summary.observedSellThrough * 100 : 0 },
  ];

  const monthLabel = MONTH_LABELS[pva.monthIndex] ?? "";
  const hasRecords = records.sales.length + records.expenses.length + records.batches.length + records.orders.length > 0;

  function exportJson() {
    downloadText("native-nursery-actuals.json", JSON.stringify({ app: "native-nursery", version: 1, records }, null, 2), "application/json");
  }

  function importJson(text: string) {
    try {
      const parsed: unknown = JSON.parse(text);
      const source =
        typeof parsed === "object" && parsed != null && "records" in parsed
          ? (parsed as { records: unknown }).records
          : parsed;
      const next = coerceRecords(source);
      replaceRecords(next);
      setMessage(
        `Imported ${next.sales.length} sales, ${next.expenses.length} expenses, ${next.batches.length} batches, ${next.orders.length} orders and ${next.labour.length} labour weeks into this browser.`,
      );
    } catch {
      setMessage("That file is not JSON.");
    }
  }

  return (
    <div className="grid gap-5">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-serif text-4xl">Dashboard</h1>
          <p className="mt-2 max-w-3xl text-muted">
            Recorded actuals against the open scenario “{draft.name}”. Expected-to-date uses the monthly sales weights
            through {monthLabel}. Figures here are tracked numbers, not estimates.
          </p>
        </div>
        <div className="flex flex-wrap gap-2 no-print">
          <button className="btn btn-secondary" type="button" onClick={() => window.print()}>
            Print
          </button>
          <button className="btn btn-secondary" type="button" onClick={() => downloadText("native-nursery-actuals.csv", recordsToCsv(records), "text/csv")}>
            Export CSV
          </button>
          <button className="btn btn-secondary" type="button" onClick={exportJson}>
            Export JSON
          </button>
          <label className="btn btn-secondary">
            Import JSON
            <input
              className="sr-only"
              type="file"
              accept="application/json,.json"
              onChange={(event) => {
                const file = event.target.files?.[0];
                event.target.value = "";
                if (file) void file.text().then(importJson);
              }}
            />
          </label>
        </div>
      </header>
      {warning ? (
        <div className="callout" role="status">
          <p>{warning}</p>
          <button className="btn btn-ghost mt-2 no-print" type="button" onClick={dismissWarning}>
            Dismiss
          </button>
        </div>
      ) : null}
      {syncError ? (
        <div className="callout bad" role="alert">
          <p>The account sync failed and this device kept the records: {syncError}</p>
        </div>
      ) : null}
      {message ? (
        <div className="callout" role="status">
          {message}
        </div>
      ) : null}
      {!hasRecords ? (
        <div className="callout" role="status">
          <p>No records yet. Add sales and orders on the Sales page, costs on Costs, and sowing on Batches — this page turns them into the numbers below.</p>
        </div>
      ) : null}
      {syncState === "syncing" ? <p className="note">Syncing records with your account…</p> : null}
      <section className="panel">
        <h2 className="font-serif text-2xl">Actual plants against the species plan</h2>
        <p className="note mt-1">Recorded units count only when a sale names the species. Unlinked sales stay in the totals above and are not guessed into a species.</p>
        <div className="table-wrap mt-3">
          <table className="data">
            <thead>
              <tr>
                <th>Species</th>
                <th className="num">Plan to sell</th>
                <th className="num">Recorded</th>
              </tr>
            </thead>
            <tbody>
              {forecast.lines.filter((line) => line.sold > 0 || actualBySpecies.has(line.id)).map((line) => (
                <tr key={line.id}>
                  <th scope="row">{line.common}</th>
                  <td className="num">{formatUnits(line.sold)}</td>
                  <td className="num">{formatUnits(actualBySpecies.get(line.id) ?? 0)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4" aria-live="polite">
        <article className="panel">
          <p className="note">Revenue to date, ex GST</p>
          <p className="metric-value" data-testid="actual-revenue">{money(summary.revenueExGst)}</p>
          <p className="note">of {money(result.revenueExGst)} planned · {formatPercent(pva.share)} of annual sales expected by {monthLabel}</p>
        </article>
        <article className="panel">
          <p className="note">Units sold</p>
          <p className="metric-value">{formatUnits(summary.unitsSold)}</p>
          <p className="note">of {formatUnits(draft.inputs.salesTarget)} target · {formatUnits(pva.expectedUnits)} expected by {monthLabel}</p>
        </article>
        <article className="panel">
          <p className="note">Cash position</p>
          <p className="metric-value">{money(pva.cashPosition)}</p>
          <p className="note">
            {formatAud(draft.inputs.openingCash)} opening + {formatAud(summary.cashReceived)} in − {formatAud(summary.cashSpent)} out
            {pva.sketchClosing != null ? ` · sketch said ${formatAud(pva.sketchClosing)}` : ""}
          </p>
        </article>
        <article className="panel">
          <p className="note">Break-even progress</p>
          <p className="metric-value">{pva.breakEvenProgress == null ? "—" : formatPercent(pva.breakEvenProgress)}</p>
          <p className="note">
            {result.breakEven?.status === "solved"
              ? `${formatUnits(summary.unitsSold)} of ${formatUnits(result.breakEven.operatingSalesUnits ?? 0)} operating break-even sales`
              : "No break-even volume in the open scenario"}
          </p>
        </article>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <article className="panel">
          <p className="note">Stock on hand</p>
          <p className="metric-value">{formatUnits(summary.stockOnHand)}</p>
          <p className="note">{formatUnits(summary.tubeStock)} tubes · {formatUnits(summary.potStock)} pots from batch counts</p>
        </article>
        <article className="panel">
          <p className="note">Pre-orders confirmed</p>
          <p className="metric-value">{formatUnits(summary.committedUnits)}</p>
          <p className="note">
            {pva.preorderCoverage == null
              ? `${formatUnits(summary.enquiryUnits)} more units in enquiries`
              : `${formatPercent(pva.preorderCoverage)} of the ${formatUnits(result.saleableRequired ?? 0)} saleable plants needed · ${formatUnits(summary.enquiryUnits)} in enquiries`}
          </p>
        </article>
        <article className="panel">
          <p className="note">GST</p>
          <p className="metric-value">{formatAud(summary.gstCollected - summary.gstPaid, 2)}</p>
          <p className="note">{formatAud(summary.gstCollected, 2)} collected on sales − {formatAud(summary.gstPaid, 2)} paid on costs. Net position, not a BAS.</p>
        </article>
        <article className="panel">
          <p className="note">Labour logged</p>
          <p className="metric-value">{formatUnits(summary.ownerHours)} hrs</p>
          <p className="note">owner · {formatUnits(summary.hiredHours)} hrs hired across {records.labour.length} week{records.labour.length === 1 ? "" : "s"}</p>
        </article>
      </div>

      <ReforecastBoard inputs={draft.inputs} result={result} summary={summary} />

      <section className="panel">
        <h2 className="font-serif text-2xl">Plan vs actual to {monthLabel}</h2>
        <div className="table-wrap mt-3">
          <table className="data">
            <caption className="sr-only">Plan versus actual metrics</caption>
            <thead>
              <tr>
                <th>Measure</th>
                <th className="num">Expected by {monthLabel}</th>
                <th className="num">Actual</th>
                <th className="num">Plan (year)</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <th scope="row">Units sold</th>
                <td className="num">{formatUnits(pva.expectedUnits)}</td>
                <td className="num">{formatUnits(summary.unitsSold)}</td>
                <td className="num">{formatUnits(draft.inputs.salesTarget)}</td>
              </tr>
              <tr>
                <th scope="row">Revenue, ex GST</th>
                <td className="num">{money(pva.expectedRevenue)}</td>
                <td className="num">{money(summary.revenueExGst)}</td>
                <td className="num">{money(result.revenueExGst)}</td>
              </tr>
              <tr>
                <th scope="row">Blended price, ex GST</th>
                <td className="num">—</td>
                <td className="num">{money(summary.blendedPriceExGst, 2)}</td>
                <td className="num">{money(result.blendedPriceExGst, 2)}</td>
              </tr>
              <tr>
                <th scope="row">Cash operating profit</th>
                <td className="num">—</td>
                <td className="num">{money(summary.revenueExGst - summary.spendTotal)}</td>
                <td className="num">{money(result.operatingProfitBeforeOwnerLabour)}</td>
              </tr>
              <tr>
                <th scope="row">Gap to $40,000</th>
                <td className="num">—</td>
                <td className="num">{money(40_000 - (summary.revenueExGst - summary.spendTotal))}</td>
                <td className="num">{money(result.gapToProfitGoalBeforeOwnerLabour)}</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p className="note mt-2">
          The actual profit row is recorded revenue minus recorded spend. Planned profit also prices owner time as
          economic, which the ledger does not. Seed, media, tubes and equipment hit actuals when bought, not spread over
          the year.
        </p>
      </section>

      <section className="panel">
        <h2 className="font-serif text-2xl">Monthly actuals vs plan</h2>
        <div className="table-wrap mt-3">
          <table className="data">
            <caption className="sr-only">Monthly units and revenue, expected and actual</caption>
            <thead>
              <tr>
                <th>Month</th>
                <th className="num">Plan units</th>
                <th className="num">Sold</th>
                <th className="num">Plan revenue</th>
                <th className="num">Revenue</th>
                <th className="num">Spent</th>
              </tr>
            </thead>
            <tbody>
              {MONTH_LABELS.map((label, index) => {
                const share = expectedShare(draft.inputs.monthlySalesWeights, index) - expectedShare(draft.inputs.monthlySalesWeights, index - 1);
                const month = summary.monthly[index];
                return (
                  <tr key={label}>
                    <th scope="row">{label}</th>
                    <td className="num">{formatUnits(draft.inputs.salesTarget * share)}</td>
                    <td className="num">{formatUnits(month?.units ?? 0)}</td>
                    <td className="num">{money((result.revenueExGst ?? 0) * share)}</td>
                    <td className="num">{money(month?.revenueExGst ?? 0)}</td>
                    <td className="num">{money(month?.spend ?? 0)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      <section className="panel" aria-hidden="true">
        <h2 className="font-serif text-2xl">Cumulative revenue</h2>
        <p className="note mt-1">Recorded revenue against the plan’s expected curve.</p>
        <div className="mt-3 h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={monthlyChart} margin={{ top: 8, right: 8, left: 0, bottom: 8 }}>
              <CartesianGrid stroke="#ddd4c4" vertical={false} />
              <XAxis dataKey="name" tick={{ fill: "#5e584e", fontSize: 12 }} />
              <YAxis tick={{ fill: "#5e584e", fontSize: 12 }} width={56} />
              <Tooltip content={<Tip />} />
              <Line type="monotone" dataKey="expected" name="Plan" stroke="#8a5a12" strokeWidth={2} dot={false} strokeDasharray="5 3" />
              <Line type="monotone" dataKey="actual" name="Actual" stroke="#1e3b30" strokeWidth={2.5} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </section>

      <section className="panel" aria-hidden="true">
        <h2 className="font-serif text-2xl">Observed rates vs plan</h2>
        <p className="note mt-1">From the batch ledger. Zero bars mean no batches counted yet.</p>
        <div className="mt-3 h-56">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={ratesChart} margin={{ top: 8, right: 8, left: 0, bottom: 8 }}>
              <CartesianGrid stroke="#ddd4c4" vertical={false} />
              <XAxis dataKey="name" tick={{ fill: "#5e584e", fontSize: 12 }} />
              <YAxis tick={{ fill: "#5e584e", fontSize: 12 }} width={44} unit="%" />
              <Tooltip />
              <Bar dataKey="plan" name="Plan %" fill="#c9b98a" radius={[6, 6, 0, 0]} />
              <Bar dataKey="observed" name="Observed %" radius={[6, 6, 0, 0]}>
                {ratesChart.map((row) => (
                  <Cell key={row.name} fill={row.observed >= row.plan ? "#1e3b30" : "#8c3a22"} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>
    </div>
  );
}
