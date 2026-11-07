import { useMemo, useState } from "react";
import { formatUnits } from "../domain/format.ts";
import { wholesaleIllustration } from "../domain/reference.ts";
import {
  CUTTINGS_SPECIES,
  POT_PLAN,
  REFERENCE_POT_UNITS,
  REFERENCE_TUBE_UNITS,
  SEED_REFERENCE,
  SPECIES,
  TUBE_PLAN,
  filterSpecies,
  scalePlan,
  sortSpecies,
  type SpeciesFilter,
  type SpeciesSort,
} from "../domain/species.ts";
import { usePlanner } from "../state/planner-context.tsx";

const filters: { id: SpeciesFilter; label: string }[] = [
  { id: "all", label: "All 20" },
  { id: "local", label: "Bellarine local" },
  { id: "seed", label: "Seed" },
  { id: "cuttings", label: "Cuttings" },
];

export function SpeciesPage() {
  const { draft, result } = usePlanner();
  const [filter, setFilter] = useState<SpeciesFilter>("all");
  const [sort, setSort] = useState<SpeciesSort>("height");
  const rows = useMemo(() => sortSpecies(filterSpecies(SPECIES, filter), sort), [filter, sort]);
  const tubes = scalePlan(TUBE_PLAN, result.tubeUnitsSold ?? 0, REFERENCE_TUBE_UNITS);
  const pots = scalePlan(POT_PLAN, result.potUnitsSold ?? 0, REFERENCE_POT_UNITS);
  const rates = draft.inputs.germinationRate * draft.inputs.survivalRate * draft.inputs.sellThroughRate;

  return (
    <div className="grid gap-5">
      <header>
        <h1 className="font-serif text-4xl">Twenty species</h1>
        <p className="mt-2 max-w-3xl text-muted">
          Wholesale ranges are HortOS 140/150 mm listings checked 5 Nov 2026, ex GST where the listing says so. Retail prices are inc GST. Seed notes keep the GST basis from each source. Planning sale prices on the planner are a separate, older estimate.
        </p>
      </header>

      <section className="panel">
        <div className="flex flex-wrap gap-2" role="group" aria-label="Filter species">
          {filters.map((item) => (
            <button key={item.id} className="chip" type="button" aria-pressed={filter === item.id} onClick={() => setFilter(item.id)}>
              {item.label}
            </button>
          ))}
        </div>
        <label className="field mt-3 max-w-xs" htmlFor="species-sort">
          <span>Sort</span>
          <select id="species-sort" value={sort} onChange={(event) => setSort(event.target.value as SpeciesSort)}>
            <option value="height">Tallest</option>
            <option value="name">A–Z</option>
            <option value="month">Sow month</option>
            <option value="price">Wholesale minimum</option>
          </select>
        </label>
        <div className="table-wrap mt-4">
          <table className="data">
            <caption className="sr-only">Species, method, timing and observed prices</caption>
            <thead>
              <tr>
                <th>Species</th>
                <th>Type</th>
                <th>Size</th>
                <th>Local</th>
                <th>Method</th>
                <th>Sow / strike</th>
                <th>To 140 mm</th>
                <th>Wholesale</th>
                <th>Retail</th>
                <th>Seed</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.botanical}>
                  <th scope="row">
                    {row.botanical}
                    <span className="mt-1 block font-normal text-muted">{row.common}</span>
                  </th>
                  <td>{row.type}</td>
                  <td>{row.size}</td>
                  <td>{row.local}</td>
                  <td>
                    {row.method}
                    <span className="mt-1 block text-muted">{row.pretreatment}</span>
                  </td>
                  <td>
                    {row.sow}
                    <span className="mt-1 block text-muted">{row.germ}</span>
                  </td>
                  <td>{row.sale}</td>
                  <td>{row.wholesale}</td>
                  <td>{row.retail}</td>
                  <td>{row.seed}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="note mt-3">{rows.length === 0 ? "No species match that filter." : `${rows.length} species. Notes such as “tall” are about the plant, not a particular block.`}</p>
      </section>

      <section className="panel">
        <h2 className="font-serif text-2xl">Sales mix for this scenario</h2>
        <p className="note mt-1">
          Counts follow the open scenario’s tube and pot sales, using the year-1 proportions, rounded to five. They are sales counts. Starts are those counts divided by germination, survival and sell-through together, so 85% is not applied a second time.
        </p>
        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          <MixTable title="Tubes" rows={tubes} rates={rates} />
          <MixTable title="140 mm" rows={pots} rates={rates} />
        </div>
        <p className="note mt-3">Cuttings stay cuttings for {CUTTINGS_SPECIES.join(", ")}. Bought tip material is a quote, not part of the seed allowance.</p>
      </section>

      <section className="panel">
        <h2 className="font-serif text-2xl">{wholesaleIllustration.title}</h2>
        <p className="mt-2">Wholesale {wholesaleIllustration.wholesale}. Retail {wholesaleIllustration.retail}.</p>
        <p className="note mt-2">{wholesaleIllustration.detail}</p>
      </section>

      <section className="panel">
        <h2 className="font-serif text-2xl">Purchased seed reference</h2>
        <p className="note mt-1">
          These are the pack and gram prices behind the $200 and $550 allowances. The allowances are estimates, not quotes, and they are not added on top of a calculated seed bill. Prices recorded in the November 2026 notes.
        </p>
        <div className="table-wrap mt-3">
          <table className="data">
            <caption className="sr-only">Observed seed prices</caption>
            <thead>
              <tr>
                <th>Species</th>
                <th>Year-1 sales note</th>
                <th>Suggested buy</th>
                <th>Observed price</th>
                <th>GST basis</th>
              </tr>
            </thead>
            <tbody>
              {SEED_REFERENCE.map((row) => (
                <tr key={row.species}>
                  <th scope="row">{row.species}</th>
                  <td>{row.target}</td>
                  <td>{row.buy}</td>
                  <td>
                    <a className="underline" href={row.href}>
                      {row.price}
                    </a>
                  </td>
                  <td>{row.gst}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function MixTable({ title, rows, rates }: { title: string; rows: { name: string; count: number; start: string }[]; rates: number }) {
  const total = rows.reduce((sum, row) => sum + row.count, 0);
  return (
    <div>
      <h3 className="font-semibold">{title}</h3>
      <div className="table-wrap">
        <table className="data">
          <thead>
            <tr>
              <th>Species</th>
              <th className="num">Sales</th>
              <th className="num">Starts</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.name}>
                <th scope="row">
                  {row.name}
                  <span className="mt-1 block font-normal text-muted">{row.start}</span>
                </th>
                <td className="num">{formatUnits(row.count)}</td>
                <td className="num">{rates > 0 ? formatUnits(row.count / rates) : "—"}</td>
              </tr>
            ))}
            <tr>
              <th scope="row">Total</th>
              <td className="num">{formatUnits(total)}</td>
              <td className="num">{rates > 0 ? formatUnits(total / rates) : "—"}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
