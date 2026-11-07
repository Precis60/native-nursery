import { applyForecast, buildForecast, emptyPlan, lineEdit, suggestedPackPrice, SUGGESTION_CHECKED, tubeSuggestion, potSuggestion, type LineEdit, type NurseryPlan, type PriceChoice } from "../domain/plan.ts";
import { MONTH_LABELS } from "../domain/model.ts";
import { SALE_CHANNELS } from "../domain/records.ts";
import { SEED_REFERENCE, SPECIES } from "../domain/species.ts";
import { usePlanner } from "../state/planner-context.tsx";

function planOf(inputs: { plan?: NurseryPlan }): NurseryPlan {
  return inputs.plan ?? emptyPlan();
}

export function SpeciesPlan() {
  const { draft, setInputs } = usePlanner();
  const forecast = buildForecast(draft.inputs);
  const usingCash = draft.inputs.plan != null;

  function commit(plan: NurseryPlan) {
    setInputs(applyForecast(draft.inputs, plan), true);
  }

  function patch(id: string, change: Partial<LineEdit>) {
    const plan = planOf(draft.inputs);
    const lines = { ...plan.lines, [id]: { ...lineEdit(plan, id), ...change } };
    commit({ ...plan, lines });
  }

  return (
    <section className="panel">
      <h2 className="font-serif text-2xl">Editable plan</h2>
      <p className="note mt-1">
        Placeholders are suggestions checked {SUGGESTION_CHECKED}, or the illustrative tube price and rates. A typed value is your override. Mark a price missing when there is no listing. Missing is left out of revenue and is not $0. Reset returns that row to the suggestion.
      </p>
      {!usingCash ? (
        <p className="note mt-2">These suggestions are not in the cash forecast until you edit a row or use them.</p>
      ) : (
        <p className="note mt-2">Edits are in the cash forecast. Purchased seed there is the known pack total, not a second copy of the shopping seed line.</p>
      )}
      <div className="mt-3 flex flex-wrap gap-2">
        <button className="btn btn-secondary" type="button" onClick={() => commit(emptyPlan())}>
          Use suggestions in the cash forecast
        </button>
      </div>
      <div className="table-wrap mt-3">
        <table className="data">
          <caption className="sr-only">Editable species quantities and prices</caption>
          <thead>
            <tr>
              <th>Species</th>
              <th>Tubes sold</th>
              <th>Pots sold</th>
              <th>Pot price ex GST</th>
              <th>Channel</th>
              <th>Sale month</th>
              <th>Rates</th>
            </tr>
          </thead>
          <tbody>
            {SPECIES.map((species) => {
              const edit = lineEdit(draft.inputs.plan, species.botanical);
              const row = forecast.lines.find((item) => item.id === species.botanical);
              return (
                <tr key={species.botanical}>
                  <th scope="row">
                    {species.botanical}
                    <span className="mt-1 block font-normal text-muted">{species.common}</span>
                    <button className="btn btn-ghost mt-2" type="button" onClick={() => {
                      const plan = planOf(draft.inputs);
                      const lines = { ...plan.lines };
                      delete lines[species.botanical];
                      commit({ ...plan, lines });
                    }}>
                      Reset
                    </button>
                  </th>
                  <td>
                    <label className="sr-only" htmlFor={`tubes-${species.botanical}`}>Tubes sold for {species.common}</label>
                    <input id={`tubes-${species.botanical}`} className="w-24 rounded-lg border border-line px-2 py-2" inputMode="numeric" placeholder={String(tubeSuggestion(species.botanical))} value={edit.tubeSold ?? ""} onChange={(event) => patch(species.botanical, { tubeSold: event.target.value.trim() === "" ? null : Number(event.target.value) })} />
                  </td>
                  <td>
                    <label className="sr-only" htmlFor={`pots-${species.botanical}`}>Pots sold for {species.common}</label>
                    <input id={`pots-${species.botanical}`} className="w-24 rounded-lg border border-line px-2 py-2" inputMode="numeric" placeholder={String(potSuggestion(species.botanical))} value={edit.potSold ?? ""} onChange={(event) => patch(species.botanical, { potSold: event.target.value.trim() === "" ? null : Number(event.target.value) })} />
                  </td>
                  <td>
                    <label className="sr-only" htmlFor={`price-${species.botanical}`}>Pot price for {species.common}</label>
                    <input id={`price-${species.botanical}`} className="w-28 rounded-lg border border-line px-2 py-2" inputMode="decimal" placeholder={row?.potPrice == null ? "No listing" : String(row.potPrice)} value={edit.potPrice.kind === "override" ? String(edit.potPrice.amount) : ""} onChange={(event) => {
                      const raw = event.target.value.trim();
                      const potPrice: PriceChoice = raw === "" ? { kind: "suggestion" } : { kind: "override", amount: Number(raw) };
                      patch(species.botanical, { potPrice });
                    }} />
                    <button className="btn btn-ghost mt-1" type="button" onClick={() => patch(species.botanical, { potPrice: { kind: "missing" } })}>
                      Mark missing
                    </button>
                    <span className="mt-1 block text-muted">{row?.potPriceNote}</span>
                  </td>
                  <td>
                    <label className="sr-only" htmlFor={`channel-${species.botanical}`}>Channel for {species.common}</label>
                    <select id={`channel-${species.botanical}`} className="rounded-lg border border-line bg-white px-2 py-2" value={edit.channel ?? ""} onChange={(event) => patch(species.botanical, { channel: event.target.value || null })}>
                      <option value="">Unassigned</option>
                      {SALE_CHANNELS.map((channel) => (
                        <option key={channel} value={channel}>{channel}</option>
                      ))}
                    </select>
                  </td>
                  <td>
                    <label className="sr-only" htmlFor={`month-${species.botanical}`}>Sale month for {species.common}</label>
                    <select id={`month-${species.botanical}`} className="rounded-lg border border-line bg-white px-2 py-2" value={edit.saleMonth ?? ""} onChange={(event) => patch(species.botanical, { saleMonth: event.target.value === "" ? null : Number(event.target.value) })}>
                      <option value="">{row?.saleWindow ? `Notes: ${row.saleWindow}` : "Use monthly weights"}</option>
                      {MONTH_LABELS.map((label, index) => (
                        <option key={label} value={index}>{label}</option>
                      ))}
                    </select>
                  </td>
                  <td>
                    <label className="sr-only" htmlFor={`germ-${species.botanical}`}>Germination for {species.common}</label>
                    <input id={`germ-${species.botanical}`} className="mb-1 w-24 rounded-lg border border-line px-2 py-2" inputMode="decimal" placeholder="Germ" value={edit.germination ?? ""} onChange={(event) => patch(species.botanical, { germination: event.target.value.trim() === "" ? null : Number(event.target.value) })} />
                    <label className="sr-only" htmlFor={`survival-${species.botanical}`}>Survival for {species.common}</label>
                    <input id={`survival-${species.botanical}`} className="mb-1 w-24 rounded-lg border border-line px-2 py-2" inputMode="decimal" placeholder="Survival" value={edit.survival ?? ""} onChange={(event) => patch(species.botanical, { survival: event.target.value.trim() === "" ? null : Number(event.target.value) })} />
                    <label className="sr-only" htmlFor={`sell-${species.botanical}`}>Sell-through for {species.common}</label>
                    <input id={`sell-${species.botanical}`} className="w-24 rounded-lg border border-line px-2 py-2" inputMode="decimal" placeholder="Sell-through" value={edit.sellThrough ?? ""} onChange={(event) => patch(species.botanical, { sellThrough: event.target.value.trim() === "" ? null : Number(event.target.value) })} />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <h3 className="mt-5 font-serif text-xl">Purchased seed packs</h3>
      <p className="note mt-1">A blank pack count uses one pack when the notes give a single price. Ranges and per-gram rates stay unpriced.</p>
      <div className="table-wrap mt-3">
        <table className="data">
          <caption className="sr-only">Editable seed pack purchases</caption>
          <thead>
            <tr>
              <th>Seed</th>
              <th>Packs</th>
              <th>Pack price</th>
              <th>Cash</th>
            </tr>
          </thead>
          <tbody>
            {SEED_REFERENCE.map((row) => {
              const edit = draft.inputs.plan?.seeds[row.species];
              const listed = suggestedPackPrice(row.price);
              const forecastRow = forecast.seeds.find((item) => item.id === row.species);
              return (
                <tr key={row.species}>
                  <th scope="row">
                    <a className="underline" href={row.href}>{row.species}</a>
                    <span className="mt-1 block font-normal text-muted">{row.buy}. {row.price}. {row.gst}.</span>
                  </th>
                  <td>
                    <input className="w-24 rounded-lg border border-line px-2 py-2" inputMode="numeric" aria-label={`Packs of ${row.species}`} placeholder={listed == null ? "—" : "1"} value={edit?.packs ?? ""} onChange={(event) => {
                      const plan = planOf(draft.inputs);
                      const packs = event.target.value.trim() === "" ? null : Number(event.target.value);
                      commit({ ...plan, seeds: { ...plan.seeds, [row.species]: { packs, unitPrice: edit?.unitPrice ?? null } } });
                    }} />
                  </td>
                  <td>
                    <input className="w-28 rounded-lg border border-line px-2 py-2" inputMode="decimal" aria-label={`Pack price for ${row.species}`} placeholder={listed == null ? "No single price" : String(listed)} value={typeof edit?.unitPrice === "number" ? String(edit.unitPrice) : ""} onChange={(event) => {
                      const plan = planOf(draft.inputs);
                      const raw = event.target.value.trim();
                      commit({ ...plan, seeds: { ...plan.seeds, [row.species]: { packs: edit?.packs ?? null, unitPrice: raw === "" ? null : Number(raw) } } });
                    }} />
                    <button className="btn btn-ghost mt-1" type="button" onClick={() => {
                      const plan = planOf(draft.inputs);
                      commit({ ...plan, seeds: { ...plan.seeds, [row.species]: { packs: edit?.packs ?? null, unitPrice: "missing" } } });
                    }}>
                      Mark missing
                    </button>
                  </td>
                  <td>{forecastRow?.cash == null ? "Excluded" : forecastRow.cash.toLocaleString("en-AU", { style: "currency", currency: "AUD" })}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}
