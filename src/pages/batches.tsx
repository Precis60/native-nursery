import { useMemo, useState } from "react";
import { SelectField, TextField, toNumber, todayISO } from "../components/record-fields.tsx";
import { formatPercent, formatUnits } from "../domain/format.ts";
import { isISODate, summarise } from "../domain/records.ts";
import { INVENTORY_COVER } from "../domain/shopping.ts";
import { SPECIES } from "../domain/species.ts";
import { usePlanner } from "../state/planner-context.tsx";
import { useRecords } from "../state/records-context.tsx";

const sizeOptions = [
  ["tube", "Tube"],
  ["pot140", "140 mm"],
] as const;

function rate(part: number, whole: number): string {
  return whole > 0 ? formatPercent(part / whole) : "—";
}

export function BatchesPage() {
  const { draft, result } = usePlanner();
  const { records, syncError, warning, dismissWarning, saveEntry, deleteEntry } = useRecords();
  const summary = useMemo(() => summarise(records), [records]);
  const [message, setMessage] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [species, setSpecies] = useState("");
  const [size, setSize] = useState<"tube" | "pot140">("tube");
  const [startedAt, setStartedAt] = useState(todayISO());
  const [started, setStarted] = useState("");
  const [germinated, setGerminated] = useState("");
  const [saleable, setSaleable] = useState("");
  const [sold, setSold] = useState("");

  const sortedBatches = useMemo(() => [...records.batches].sort((a, b) => a.startedAt.localeCompare(b.startedAt)), [records.batches]);

  function addBatch() {
    const counts = {
      started: toNumber(started) ?? 0,
      germinated: toNumber(germinated) ?? 0,
      saleable: toNumber(saleable) ?? 0,
      sold: toNumber(sold) ?? 0,
    };
    if (!name.trim()) return setMessage("Name the batch, e.g. Batch A — Golden wattle.");
    if (!isISODate(startedAt)) return setMessage("Enter the sow or strike date as YYYY-MM-DD.");
    for (const [field, value] of Object.entries(counts)) {
      if (!Number.isFinite(value) || value < 0) return setMessage(`${field} needs to be zero or more.`);
    }
    if (counts.started <= 0) return setMessage("A batch with nothing started is not worth tracking yet.");
    if (counts.germinated > counts.started) return setMessage("Germinated cannot exceed started.");
    if (counts.saleable > counts.germinated) return setMessage("Saleable cannot exceed germinated.");
    if (counts.sold > counts.saleable) return setMessage("Sold cannot exceed saleable.");
    saveEntry("batch", { name: name.trim(), species: species.trim(), size, startedAt, ...counts });
    setName("");
    setSpecies("");
    setStarted("");
    setGerminated("");
    setSaleable("");
    setSold("");
    setMessage(null);
  }

  return (
    <div className="grid gap-5">
      <header>
        <h1 className="font-serif text-4xl">Production batches</h1>
        <p className="mt-2 max-w-3xl text-muted">
          What actually germinated, survived and sold per batch. Update the counts as the batch moves on — the observed
          rates below replace the planner’s {formatPercent(draft.inputs.germinationRate)} germination,{" "}
          {formatPercent(draft.inputs.survivalRate)} survival and {formatPercent(draft.inputs.sellThroughRate)} sell-through
          assumptions with your own numbers.
        </p>
      </header>
      {warning ? (
        <div className="callout" role="status">
          <p>{warning}</p>
          <button className="btn btn-ghost mt-2" type="button" onClick={dismissWarning}>
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

      <section className="panel">
        <h2 className="font-serif text-2xl">Track a batch</h2>
        <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <TextField id="batch-name" label="Batch name" value={name} onChange={setName} placeholder="e.g. Batch A — Golden wattle" />
          <label className="field" htmlFor="batch-species">
            <span>Species</span>
            <input id="batch-species" list="species-list" value={species} onChange={(event) => setSpecies(event.target.value)} placeholder="Start typing a botanical name" />
            <datalist id="species-list">
              {SPECIES.map((row) => (
                <option key={row.botanical} value={row.botanical} />
              ))}
            </datalist>
          </label>
          <SelectField id="batch-size" label="Size" value={size} onChange={(value) => setSize(value as "tube" | "pot140")} options={sizeOptions} />
          <TextField id="batch-started-at" label="Sown or struck" type="date" value={startedAt} onChange={setStartedAt} />
          <TextField id="batch-started" label="Started" type="number" value={started} onChange={setStarted} hint="Seeds sown or cuttings struck" />
          <TextField id="batch-germinated" label="Germinated" type="number" value={germinated} onChange={setGerminated} hint="Roots or shoots that took" />
          <TextField id="batch-saleable" label="Saleable" type="number" value={saleable} onChange={setSaleable} hint="Plants ready to sell" />
          <TextField id="batch-sold" label="Sold" type="number" value={sold} onChange={setSold} hint="Gone out the gate" />
        </div>
        <button className="btn btn-primary mt-3" type="button" onClick={addBatch}>
          Add batch
        </button>
      </section>

      <section className="panel">
        <h2 className="font-serif text-2xl">Observed rates</h2>
        <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <RateCard label="Germination" observed={summary.observedGermination} assumed={draft.inputs.germinationRate} />
          <RateCard label="Survival to saleable" observed={summary.observedSurvival} assumed={draft.inputs.survivalRate} />
          <RateCard label="Sell-through" observed={summary.observedSellThrough} assumed={draft.inputs.sellThroughRate} />
          <div>
            <dt className="note">Stock on hand</dt>
            <dd className="text-xl font-semibold">{formatUnits(summary.stockOnHand)}</dd>
            <p className="note">
              {formatUnits(summary.tubeStock)} tubes · {formatUnits(summary.potStock)} pots
            </p>
          </div>
        </div>
        <p className="note mt-3">
          Observed = the sum across every batch. A batch with no germination yet drags the rate down — read the table
          rows for a fair per-batch figure. Full-scale container buys cover {formatUnits(INVENTORY_COVER.full.tubeSlots)}{" "}
          purchased tube slots plus {formatUnits(INVENTORY_COVER.full.potsPurchased + INVENTORY_COVER.full.potsOwned)} pots.
          {result.saleableRequired != null
            ? ` The open scenario needs ${formatUnits(result.saleableRequired)} saleable plants; ${formatUnits(summary.saleable)} are on the books.`
            : ""}
        </p>
      </section>

      <section className="panel">
        <h2 className="font-serif text-2xl">Batch ledger</h2>
        {sortedBatches.length === 0 ? (
          <p className="mt-3">No batches yet. Batch A from the calendar (wattles, sheoak, gums, Lomandra, Goodenia) is the first to log.</p>
        ) : (
          <div className="table-wrap mt-3">
            <table className="data">
              <caption className="sr-only">Production batches</caption>
              <thead>
                <tr>
                  <th>Batch</th>
                  <th>Sown / struck</th>
                  <th className="num">Started</th>
                  <th className="num">Germinated</th>
                  <th className="num">Saleable</th>
                  <th className="num">Sold</th>
                  <th className="num">On hand</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {sortedBatches.map((batch) => (
                  <tr key={batch.id}>
                    <th scope="row">
                      {batch.name}
                      <span className="mt-1 block font-normal text-muted">
                        {batch.species ? `${batch.species} · ` : ""}
                        {batch.size === "tube" ? "Tube" : "140 mm"}
                      </span>
                    </th>
                    <td>{batch.startedAt}</td>
                    <td className="num">{formatUnits(batch.started)}</td>
                    <td className="num">
                      {formatUnits(batch.germinated)}
                      <span className="mt-1 block text-muted">{rate(batch.germinated, batch.started)}</span>
                    </td>
                    <td className="num">
                      {formatUnits(batch.saleable)}
                      <span className="mt-1 block text-muted">{rate(batch.saleable, batch.germinated)}</span>
                    </td>
                    <td className="num">
                      {formatUnits(batch.sold)}
                      <span className="mt-1 block text-muted">{rate(batch.sold, batch.saleable)}</span>
                    </td>
                    <td className="num">{formatUnits(Math.max(batch.saleable - batch.sold, 0))}</td>
                    <td className="num">
                      <button className="btn btn-ghost" type="button" onClick={() => deleteEntry("batch", batch.id)}>
                        Remove
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

function RateCard({ label, observed, assumed }: { label: string; observed: number | null; assumed: number }) {
  return (
    <div>
      <dt className="note">{label}</dt>
      <dd className="text-xl font-semibold">{observed == null ? "—" : formatPercent(observed)}</dd>
      <p className="note">plan {formatPercent(assumed)}</p>
    </div>
  );
}
